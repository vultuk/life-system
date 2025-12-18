import type { Context } from "hono";
import type { UserContext } from "@life/shared";

interface ProxyOptions {
  baseUrl: string;
  path: string;
  user?: UserContext | undefined;
}

export async function proxyRequest(
  c: Context,
  options: ProxyOptions
): Promise<Response> {
  const { baseUrl, path, user } = options;

  const url = new URL(path, baseUrl);

  // Preserve query params
  const queryParams = c.req.query();
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  });

  const headers = new Headers();
  headers.set("Content-Type", "application/json");

  // Forward user context as headers
  if (user) {
    headers.set("X-User-Id", user.userId);
    headers.set("X-User-Email", user.email);
  }

  // Copy relevant headers from original request
  const originalContentType = c.req.header("Content-Type");
  if (originalContentType) {
    headers.set("Content-Type", originalContentType);
  }

  const method = c.req.method;
  let body: string | undefined;

  if (method !== "GET" && method !== "HEAD") {
    try {
      body = await c.req.text();
    } catch {
      // No body
    }
  }

  try {
    console.log(`Proxying ${method} request to: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body || undefined,
    });

    // Return the proxied response
    const responseBody = await response.text();
    return new Response(responseBody, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error(`Proxy error to ${url.toString()}:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: `Failed to connect to upstream service: ${error instanceof Error ? error.message : 'Unknown error'}`
      }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export function createProxyHandler(serviceUrl: string, pathPrefix: string = "") {
  return async (c: Context) => {
    const user = c.get("user") as UserContext | undefined;
    const path = pathPrefix + c.req.path.replace(/^\/[^/]+/, "");

    return proxyRequest(c, {
      baseUrl: serviceUrl,
      path,
      user,
    });
  };
}
