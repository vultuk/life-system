import { z } from "zod";
import { getClient, type PaginatedData } from "../client";

// Types
interface Category {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}

// Schemas
const listCategoriesSchema = z.object({
  search: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

const createCategorySchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  icon: z.string().optional(),
});

const getCategorySchema = z.object({
  id: z.string().uuid(),
});

const updateCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
});

const deleteCategorySchema = z.object({
  id: z.string().uuid(),
});

// Tool definitions
export const categoryTools = [
  {
    name: "list_categories",
    description: "List all categories, optionally filter by search term",
    inputSchema: {
      type: "object" as const,
      properties: {
        search: {
          type: "string",
          description: "Search categories by name",
        },
        page: {
          type: "number",
          description: "Page number (default: 1)",
        },
        limit: {
          type: "number",
          description: "Items per page (default: 50, max: 100)",
        },
      },
    },
    handler: async (params: unknown) => {
      const input = listCategoriesSchema.parse(params);
      const client = getClient();
      const result = await client.get<PaginatedData<Category>>("/categories", {
        search: input.search,
        page: input.page,
        limit: input.limit,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  },
  {
    name: "create_category",
    description: "Create a new category for organizing items",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Category name (required)",
        },
        color: {
          type: "string",
          description: "Hex color code (e.g., #FF5733)",
        },
        icon: {
          type: "string",
          description: "Icon identifier for the category",
        },
      },
      required: ["name"],
    },
    handler: async (params: unknown) => {
      const input = createCategorySchema.parse(params);
      const client = getClient();
      const category = await client.post<Category>("/categories", input);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(category, null, 2),
          },
        ],
      };
    },
  },
  {
    name: "get_category",
    description: "Get a specific category by ID",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "Category ID (UUID)",
        },
      },
      required: ["id"],
    },
    handler: async (params: unknown) => {
      const input = getCategorySchema.parse(params);
      const client = getClient();
      const category = await client.get<Category>(`/categories/${input.id}`);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(category, null, 2),
          },
        ],
      };
    },
  },
  {
    name: "update_category",
    description: "Update an existing category",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "Category ID (UUID)",
        },
        name: {
          type: "string",
          description: "New category name",
        },
        color: {
          type: "string",
          description: "New hex color code (null to clear)",
        },
        icon: {
          type: "string",
          description: "New icon identifier (null to clear)",
        },
      },
      required: ["id"],
    },
    handler: async (params: unknown) => {
      const input = updateCategorySchema.parse(params);
      const { id, ...updates } = input;
      const client = getClient();
      const category = await client.put<Category>(`/categories/${id}`, updates);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(category, null, 2),
          },
        ],
      };
    },
  },
  {
    name: "delete_category",
    description: "Delete a category (items in the category will have their category cleared)",
    inputSchema: {
      type: "object" as const,
      properties: {
        id: {
          type: "string",
          description: "Category ID (UUID)",
        },
      },
      required: ["id"],
    },
    handler: async (params: unknown) => {
      const input = deleteCategorySchema.parse(params);
      const client = getClient();
      await client.delete(`/categories/${input.id}`);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ success: true, message: "Category deleted" }, null, 2),
          },
        ],
      };
    },
  },
];
