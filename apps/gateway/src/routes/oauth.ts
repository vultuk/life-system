import { Hono } from "hono";
import { z } from "zod";
import { eq, and, gt } from "drizzle-orm";
import { randomUUID, createHash } from "crypto";
import { db, users, oauthClients, oauthAuthorizationCodes } from "@life/db";
import { createToken } from "../middleware/auth";
// Note: ValidationError, UnauthorizedError available from @life/shared if needed

const oauthRoutes = new Hono();

const getGatewayUrl = () => {
  return process.env.GATEWAY_URL || `http://localhost:${process.env.PORT || 3000}`;
};

// ============================================================================
// OAuth Authorization Server Metadata
// ============================================================================

oauthRoutes.get("/.well-known/oauth-authorization-server", (c) => {
  const baseUrl = getGatewayUrl();

  return c.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    registration_endpoint: `${baseUrl}/oauth/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: ["openid", "profile", "tasks", "contacts", "notes", "habits"],
  });
});

// ============================================================================
// Authorization Endpoint - GET (show login form)
// ============================================================================

oauthRoutes.get("/authorize", async (c) => {
  const clientId = c.req.query("client_id");
  const redirectUri = c.req.query("redirect_uri");
  const responseType = c.req.query("response_type");
  const state = c.req.query("state") || "";
  const codeChallenge = c.req.query("code_challenge");
  const codeChallengeMethod = c.req.query("code_challenge_method") || "S256";
  const scope = c.req.query("scope") || "openid profile";

  // Validate required parameters
  if (!clientId || !redirectUri || responseType !== "code" || !codeChallenge) {
    return c.html(renderErrorPage("Missing required OAuth parameters. Required: client_id, redirect_uri, response_type=code, code_challenge"));
  }

  // Get client name (if registered)
  let clientName = clientId;
  const [client] = await db
    .select()
    .from(oauthClients)
    .where(eq(oauthClients.clientId, clientId))
    .limit(1);

  if (client?.clientName) {
    clientName = client.clientName;
  }

  // Render login/consent page
  return c.html(renderAuthorizePage({
    clientId,
    clientName,
    redirectUri,
    state,
    codeChallenge,
    codeChallengeMethod,
    scope,
    error: null,
  }));
});

// ============================================================================
// Authorization Endpoint - POST (handle login + consent)
// ============================================================================

const authorizeSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  client_id: z.string(),
  redirect_uri: z.string().url(),
  state: z.string().optional(),
  code_challenge: z.string(),
  code_challenge_method: z.string().default("S256"),
  scope: z.string().default("openid profile"),
});

oauthRoutes.post("/authorize", async (c) => {
  const formData = await c.req.parseBody();
  const parsed = authorizeSchema.safeParse(formData);

  if (!parsed.success) {
    return c.html(renderAuthorizePage({
      clientId: formData.client_id as string || "",
      clientName: formData.client_id as string || "",
      redirectUri: formData.redirect_uri as string || "",
      state: formData.state as string || "",
      codeChallenge: formData.code_challenge as string || "",
      codeChallengeMethod: formData.code_challenge_method as string || "S256",
      scope: formData.scope as string || "openid profile",
      error: "Invalid form data",
    }));
  }

  const { email, password, client_id, redirect_uri, state, code_challenge, code_challenge_method, scope } = parsed.data;

  // Authenticate user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return c.html(renderAuthorizePage({
      clientId: client_id,
      clientName: client_id,
      redirectUri: redirect_uri,
      state: state || "",
      codeChallenge: code_challenge,
      codeChallengeMethod: code_challenge_method,
      scope,
      error: "Invalid email or password",
    }));
  }

  const isValid = await Bun.password.verify(password, user.passwordHash);
  if (!isValid) {
    return c.html(renderAuthorizePage({
      clientId: client_id,
      clientName: client_id,
      redirectUri: redirect_uri,
      state: state || "",
      codeChallenge: code_challenge,
      codeChallengeMethod: code_challenge_method,
      scope,
      error: "Invalid email or password",
    }));
  }

  // Generate authorization code
  const code = randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Store authorization code in database
  await db.insert(oauthAuthorizationCodes).values({
    code,
    clientId: client_id,
    userId: user.id,
    redirectUri: redirect_uri,
    codeChallenge: code_challenge,
    codeChallengeMethod: code_challenge_method,
    scopes: scope.split(" "),
    expiresAt,
  });

  // Redirect back with code
  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set("code", code);
  if (state) {
    redirectUrl.searchParams.set("state", state);
  }

  return c.redirect(redirectUrl.toString());
});

// ============================================================================
// Token Endpoint
// ============================================================================

const tokenSchema = z.object({
  grant_type: z.literal("authorization_code"),
  code: z.string(),
  redirect_uri: z.string().url(),
  client_id: z.string(),
  code_verifier: z.string(),
});

oauthRoutes.post("/token", async (c) => {
  const contentType = c.req.header("Content-Type") || "";
  let body: Record<string, unknown>;

  if (contentType.includes("application/x-www-form-urlencoded")) {
    body = await c.req.parseBody() as Record<string, unknown>;
  } else {
    body = await c.req.json();
  }

  const parsed = tokenSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({
      error: "invalid_request",
      error_description: parsed.error.errors.map(e => e.message).join(", "),
    }, 400);
  }

  const { code, redirect_uri, client_id, code_verifier } = parsed.data;

  // Get stored authorization code
  const [authCode] = await db
    .select()
    .from(oauthAuthorizationCodes)
    .where(
      and(
        eq(oauthAuthorizationCodes.code, code),
        gt(oauthAuthorizationCodes.expiresAt, new Date())
      )
    )
    .limit(1);

  if (!authCode) {
    return c.json({
      error: "invalid_grant",
      error_description: "Invalid or expired authorization code",
    }, 400);
  }

  // Verify client_id and redirect_uri match
  if (authCode.clientId !== client_id || authCode.redirectUri !== redirect_uri) {
    return c.json({
      error: "invalid_grant",
      error_description: "Client ID or redirect URI mismatch",
    }, 400);
  }

  // Verify PKCE code challenge
  const expectedChallenge = createHash("sha256")
    .update(code_verifier)
    .digest("base64url");

  if (expectedChallenge !== authCode.codeChallenge) {
    return c.json({
      error: "invalid_grant",
      error_description: "Invalid code verifier",
    }, 400);
  }

  // Delete used authorization code
  await db
    .delete(oauthAuthorizationCodes)
    .where(eq(oauthAuthorizationCodes.code, code));

  // Get user and generate JWT
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, authCode.userId))
    .limit(1);

  if (!user) {
    return c.json({
      error: "invalid_grant",
      error_description: "User not found",
    }, 400);
  }

  const accessToken = await createToken({
    userId: user.id,
    email: user.email,
  });

  return c.json({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 7 * 24 * 60 * 60, // 7 days in seconds
    scope: (authCode.scopes as string[] || []).join(" "),
  });
});

// ============================================================================
// Dynamic Client Registration
// ============================================================================

const registerClientSchema = z.object({
  redirect_uris: z.array(z.string().url()),
  client_name: z.string().optional(),
  grant_types: z.array(z.string()).optional().default(["authorization_code"]),
  scope: z.string().optional(),
});

oauthRoutes.post("/register", async (c) => {
  const body = await c.req.json();
  const parsed = registerClientSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({
      error: "invalid_client_metadata",
      error_description: parsed.error.errors.map(e => e.message).join(", "),
    }, 400);
  }

  const { redirect_uris, client_name, grant_types, scope } = parsed.data;

  const clientId = randomUUID();
  const clientSecret = randomUUID();

  // Store client in database
  await db.insert(oauthClients).values({
    clientId,
    clientSecret,
    clientName: client_name || null,
    redirectUris: redirect_uris,
    grantTypes: grant_types,
    scopes: scope ? scope.split(" ") : [],
  });

  return c.json({
    client_id: clientId,
    client_secret: clientSecret,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    redirect_uris,
    client_name,
    grant_types,
    token_endpoint_auth_method: "none",
  }, 201);
});

// ============================================================================
// HTML Templates
// ============================================================================

interface AuthorizePageParams {
  clientId: string;
  clientName: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  scope: string;
  error: string | null;
}

function renderAuthorizePage(params: AuthorizePageParams): string {
  const { clientId, clientName, redirectUri, state, codeChallenge, codeChallengeMethod, scope, error } = params;
  const scopes = scope.split(" ").filter(Boolean);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in - Life System</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
      width: 100%;
      max-width: 420px;
      padding: 40px;
    }
    .logo {
      text-align: center;
      margin-bottom: 24px;
    }
    .logo h1 {
      font-size: 24px;
      color: #1a1a2e;
    }
    .client-info {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
      text-align: center;
    }
    .client-info p {
      color: #666;
      font-size: 14px;
    }
    .client-info strong {
      color: #1a1a2e;
    }
    .scopes {
      margin-top: 12px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
    }
    .scope-badge {
      background: #e9ecef;
      color: #495057;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
    }
    .error {
      background: #fee2e2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 14px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 8px;
    }
    input[type="email"],
    input[type="password"] {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    button {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    button:active {
      transform: translateY(0);
    }
    .footer {
      text-align: center;
      margin-top: 24px;
      color: #9ca3af;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <h1>Life System</h1>
    </div>

    <div class="client-info">
      <p><strong>${escapeHtml(clientName)}</strong> wants to access your account</p>
      <div class="scopes">
        ${scopes.map(s => `<span class="scope-badge">${escapeHtml(s)}</span>`).join("")}
      </div>
    </div>

    ${error ? `<div class="error">${escapeHtml(error)}</div>` : ""}

    <form method="POST" action="/oauth/authorize">
      <input type="hidden" name="client_id" value="${escapeHtml(clientId)}">
      <input type="hidden" name="redirect_uri" value="${escapeHtml(redirectUri)}">
      <input type="hidden" name="state" value="${escapeHtml(state)}">
      <input type="hidden" name="code_challenge" value="${escapeHtml(codeChallenge)}">
      <input type="hidden" name="code_challenge_method" value="${escapeHtml(codeChallengeMethod)}">
      <input type="hidden" name="scope" value="${escapeHtml(scope)}">

      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" required autocomplete="email">
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required autocomplete="current-password">
      </div>

      <button type="submit">Sign in and Authorize</button>
    </form>

    <div class="footer">
      By signing in, you authorize this application to access your Life System data.
    </div>
  </div>
</body>
</html>`;
}

function renderErrorPage(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - Life System</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
      width: 100%;
      max-width: 420px;
      padding: 40px;
      text-align: center;
    }
    h1 { color: #dc2626; margin-bottom: 16px; }
    p { color: #666; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Authorization Error</h1>
    <p>${escapeHtml(message)}</p>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export { oauthRoutes };
