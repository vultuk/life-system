import { Hono } from "hono";
import type { Context } from "hono";

const mcpRoutes = new Hono();

const getMcpServiceUrl = () => {
  const url = process.env.MCP_SERVICE_URL;
  if (!url) {
    return "http://localhost:3001";
  }
  return url;
};

/**
 * Proxy MCP requests to the MCP service
 * Handles SSE streaming and passes through auth headers
 */
async function proxyMcpRequest(c: Context): Promise<Response> {
  const baseUrl = getMcpServiceUrl();
  const path = c.req.path;
  const url = new URL(path, baseUrl);

  // Preserve query params
  const queryParams = c.req.query();
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  });

  // Copy important headers
  const headers = new Headers();

  // Pass through auth
  const authHeader = c.req.header("Authorization");
  if (authHeader) {
    headers.set("Authorization", authHeader);
  }

  // Pass through MCP-specific headers
  const sessionId = c.req.header("mcp-session-id");
  if (sessionId) {
    headers.set("mcp-session-id", sessionId);
  }

  const protocolVersion = c.req.header("mcp-protocol-version");
  if (protocolVersion) {
    headers.set("mcp-protocol-version", protocolVersion);
  }

  // Content type
  const contentType = c.req.header("Content-Type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  // Accept header (important for SSE)
  const accept = c.req.header("Accept");
  if (accept) {
    headers.set("Accept", accept);
  }

  const method = c.req.method;
  let body: string | undefined;

  if (method === "POST") {
    try {
      body = await c.req.text();
    } catch {
      // No body
    }
  }

  try {
    console.log(`MCP Proxying ${method} request to: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body || undefined,
    });

    // For SSE responses, we need to stream the response
    const responseContentType = response.headers.get("Content-Type") || "";

    if (responseContentType.includes("text/event-stream")) {
      // SSE streaming - return the response directly with proper headers
      const responseHeaders = new Headers();
      responseHeaders.set("Content-Type", "text/event-stream");
      responseHeaders.set("Cache-Control", "no-cache");
      responseHeaders.set("Connection", "keep-alive");

      // Copy mcp-session-id if present
      const respSessionId = response.headers.get("mcp-session-id");
      if (respSessionId) {
        responseHeaders.set("mcp-session-id", respSessionId);
      }

      return new Response(response.body, {
        status: response.status,
        headers: responseHeaders,
      });
    }

    // Regular response - copy all headers
    const responseHeaders = new Headers();
    for (const [key, value] of response.headers.entries()) {
      responseHeaders.set(key, value);
    }

    const responseBody = await response.text();
    return new Response(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`MCP proxy error to ${url.toString()}:`, error);
    return new Response(JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32603,
        message: "Bad Gateway",
      },
      id: null,
    }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// MCP endpoint handlers
mcpRoutes.post("/", proxyMcpRequest);
mcpRoutes.get("/", proxyMcpRequest);
mcpRoutes.delete("/", proxyMcpRequest);
mcpRoutes.options("/", proxyMcpRequest);

export { mcpRoutes };
