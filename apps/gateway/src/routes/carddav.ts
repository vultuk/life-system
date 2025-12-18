import { Hono } from "hono";
import type { Context } from "hono";

const carddavRoutes = new Hono();

const getCarddavServiceUrl = () => {
  const url = process.env.CARDDAV_SERVICE_URL;
  if (!url) {
    // Default to local development URL
    return "http://localhost:3007";
  }
  return url;
};

/**
 * Proxy CardDAV requests to the CardDAV service
 * This passes through ALL headers including Authorization for Basic Auth
 */
async function proxyCarddavRequest(c: Context): Promise<Response> {
  const baseUrl = getCarddavServiceUrl();

  // Construct the path - keep /carddav prefix as the service expects it
  const path = c.req.path;
  const url = new URL(path, baseUrl);

  // Preserve query params
  const queryParams = c.req.query();
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, value);
    }
  });

  // Copy ALL headers from the original request
  const headers = new Headers();
  for (const [key, value] of c.req.raw.headers.entries()) {
    // Skip host header as it will be set by fetch
    if (key.toLowerCase() !== "host") {
      headers.set(key, value);
    }
  }

  const method = c.req.method;
  let body: string | undefined;

  // WebDAV methods that have request bodies
  if (method !== "GET" && method !== "HEAD" && method !== "DELETE" && method !== "OPTIONS") {
    try {
      body = await c.req.text();
    } catch {
      // No body
    }
  }

  try {
    console.log(`CardDAV Proxying ${method} request to: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: body || undefined,
    });

    // Copy response headers
    const responseHeaders = new Headers();
    for (const [key, value] of response.headers.entries()) {
      responseHeaders.set(key, value);
    }

    // Return the proxied response with all headers
    const responseBody = await response.text();
    return new Response(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`CardDAV proxy error to ${url.toString()}:`, error);
    return new Response("Bad Gateway", { status: 502 });
  }
}

// Handle all CardDAV methods - these need to pass through WITHOUT gateway auth
// The CardDAV service handles its own Basic Auth

// OPTIONS - needed for DAV capabilities discovery
carddavRoutes.on("OPTIONS", "/*", proxyCarddavRequest);

// PROPFIND - WebDAV discovery
carddavRoutes.on("PROPFIND", "/*", proxyCarddavRequest);

// REPORT - sync-collection, multiget, query
carddavRoutes.on("REPORT", "/*", proxyCarddavRequest);

// Standard HTTP methods
carddavRoutes.get("/*", proxyCarddavRequest);
carddavRoutes.put("/*", proxyCarddavRequest);
carddavRoutes.delete("/*", proxyCarddavRequest);
carddavRoutes.on("HEAD", "/*", proxyCarddavRequest);

export { carddavRoutes };
