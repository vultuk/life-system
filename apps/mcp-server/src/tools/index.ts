import { taskTools } from "./tasks";
import { contactTools } from "./contacts";
import { noteTools } from "./notes";
import { habitTools } from "./habits";
import { categoryTools } from "./categories";

// Re-export individual tool collections
export { taskTools } from "./tasks";
export { contactTools } from "./contacts";
export { noteTools } from "./notes";
export { habitTools } from "./habits";
export { categoryTools } from "./categories";

// Combine all tools
export const allTools = [
  ...taskTools,
  ...contactTools,
  ...noteTools,
  ...habitTools,
  ...categoryTools,
];

// Tool type definition
interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  handler: (params: unknown) => Promise<{
    content: Array<{ type: "text"; text: string }>;
  }>;
}

// Get tool handlers map
export function getToolHandlers(): Map<string, Tool["handler"]> {
  const handlers = new Map<string, Tool["handler"]>();
  for (const tool of allTools) {
    handlers.set(tool.name, tool.handler);
  }
  return handlers;
}

// Get tool definitions (for listing)
export function getToolDefinitions(): Array<{
  name: string;
  description: string;
  inputSchema: Tool["inputSchema"];
}> {
  return allTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));
}
