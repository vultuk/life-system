/**
 * HTTP client wrapper for calling the Gateway API
 */

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export class GatewayClient {
  private baseUrl: string;
  private token: string;

  constructor() {
    const gatewayUrl = process.env.GATEWAY_URL;
    const token = process.env.MCP_USER_TOKEN;

    if (!gatewayUrl) {
      throw new Error("GATEWAY_URL environment variable is not set");
    }

    if (!token) {
      throw new Error("MCP_USER_TOKEN environment variable is not set");
    }

    this.baseUrl = gatewayUrl.replace(/\/$/, ""); // Remove trailing slash
    this.token = token;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorBody = (await response.json()) as ApiResponse<unknown>;
        if (errorBody.error) {
          errorMessage = errorBody.error;
        }
      } catch {
        // Ignore JSON parse errors
      }
      throw new Error(errorMessage);
    }

    const json = (await response.json()) as ApiResponse<T>;

    if (!json.success) {
      throw new Error(json.error || "Request failed");
    }

    return json.data as T;
  }

  async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    let url = path;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        url = `${path}?${queryString}`;
      }
    }
    return this.request<T>("GET", url);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }
}

// Singleton instance
let client: GatewayClient | null = null;

export function getClient(): GatewayClient {
  if (!client) {
    client = new GatewayClient();
  }
  return client;
}

// Type exports for use in tools
export type { ApiResponse, PaginatedData };
