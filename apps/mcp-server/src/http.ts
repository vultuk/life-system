import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { randomUUID } from "crypto";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { getToolDefinitions, getToolHandlers } from "./tools/index.js";
import { verifyToken, setUserContext, type UserContext } from "./auth.js";

const app = new Hono();

// Session management - maps session IDs to transports and user contexts
const sessions = new Map<string, {
  transport: WebStandardStreamableHTTPServerTransport;
  server: Server;
  userContext: UserContext | null;
}>();

// Middleware
app.use("*", logger());
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "mcp-session-id", "mcp-protocol-version"],
  exposeHeaders: ["mcp-session-id"],
}));

// Health check
app.get("/health", (c) => c.json({ status: "ok", service: "mcp-server" }));

// OAuth Protected Resource Metadata
app.get("/.well-known/oauth-protected-resource", (c) => {
  const gatewayUrl = process.env.GATEWAY_URL || "http://localhost:3000";
  const mcpServerUrl = process.env.MCP_SERVER_URL || `http://localhost:${process.env.PORT || 3001}`;

  return c.json({
    resource: mcpServerUrl,
    authorization_servers: [gatewayUrl],
    scopes_supported: ["openid", "profile", "tasks", "contacts", "notes", "habits"],
    bearer_methods_supported: ["header"],
    resource_name: "Life System MCP Server",
  });
});

/**
 * Check if a request is an MCP initialize request
 */
function isInitializeRequest(body: unknown): boolean {
  if (typeof body !== "object" || body === null) return false;
  const msg = body as Record<string, unknown>;
  return msg.method === "initialize" && msg.jsonrpc === "2.0";
}

/**
 * Create an MCP server instance with all tool handlers
 */
function createMcpServer(): Server {
  const server = new Server(
    { name: "life-system", version: "0.0.1" },
    { capabilities: { tools: {} } }
  );

  const toolHandlers = getToolHandlers();

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: getToolDefinitions(),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const handler = toolHandlers.get(name);

    if (!handler) {
      throw new Error(`Unknown tool: ${name}`);
    }

    try {
      return await handler(args);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: message }, null, 2) }],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Authenticate request and return user context
 */
async function authenticateRequest(authHeader: string | undefined): Promise<UserContext | null> {
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

// MCP endpoint - handles POST, GET, DELETE
app.all("/mcp", async (c) => {
  const sessionId = c.req.header("mcp-session-id");
  const method = c.req.method;

  // Authenticate request
  const authHeader = c.req.header("Authorization");
  const userContext = await authenticateRequest(authHeader);

  // For non-GET requests, require authentication
  if (method !== "GET" && !userContext) {
    return new Response(JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32001,
        message: "Unauthorized: Missing or invalid Bearer token",
      },
      id: null,
    }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": `Bearer resource_metadata="${process.env.MCP_SERVER_URL || "http://localhost:3001"}/.well-known/oauth-protected-resource"`,
      },
    });
  }

  // Handle POST requests
  if (method === "POST") {
    const body = await c.req.json();

    // Check for existing session
    if (sessionId && sessions.has(sessionId)) {
      const session = sessions.get(sessionId)!;

      // Set user context for this request
      if (session.userContext) {
        setUserContext(session.userContext);
      }

      return session.transport.handleRequest(c.req.raw, { parsedBody: body });
    }

    // New session - must be an initialize request
    if (!sessionId && isInitializeRequest(body)) {
      const newSessionId = randomUUID();

      const transport = new WebStandardStreamableHTTPServerTransport({
        sessionIdGenerator: () => newSessionId,
        onsessioninitialized: (id) => {
          console.log(`MCP session initialized: ${id}`);
        },
        onsessionclosed: (id) => {
          sessions.delete(id);
          console.log(`MCP session closed: ${id}`);
        },
      });

      const server = createMcpServer();

      // Store session with user context
      sessions.set(newSessionId, {
        transport,
        server,
        userContext,
      });

      // Connect server to transport
      await server.connect(transport);

      // Set user context for this request
      if (userContext) {
        setUserContext(userContext);
      }

      return transport.handleRequest(c.req.raw, { parsedBody: body });
    }

    // Invalid request - no session and not an initialize request
    return new Response(JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32600,
        message: "Invalid request: session ID required for non-initialize requests",
      },
      id: null,
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Handle GET requests (SSE stream)
  if (method === "GET") {
    if (!sessionId || !sessions.has(sessionId)) {
      return new Response(JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32600,
          message: "Invalid or missing session ID",
        },
        id: null,
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = sessions.get(sessionId)!;
    return session.transport.handleRequest(c.req.raw);
  }

  // Handle DELETE requests (close session)
  if (method === "DELETE") {
    if (!sessionId || !sessions.has(sessionId)) {
      return new Response(JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32600,
          message: "Invalid or missing session ID",
        },
        id: null,
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = sessions.get(sessionId)!;
    const response = await session.transport.handleRequest(c.req.raw);
    sessions.delete(sessionId);
    return response;
  }

  // Method not allowed
  return new Response(JSON.stringify({
    jsonrpc: "2.0",
    error: {
      code: -32600,
      message: "Method not allowed",
    },
    id: null,
  }), {
    status: 405,
    headers: { "Content-Type": "application/json" },
  });
});

const port = Number(process.env.PORT) || 3001;
console.log(`MCP Server (HTTP) running on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
