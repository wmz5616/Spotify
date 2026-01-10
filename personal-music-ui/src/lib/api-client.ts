const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

if (typeof window !== "undefined" && !API_KEY) {
  console.error(
    "配置错误: 缺少 NEXT_PUBLIC_API_KEY 环境变量。API 请求将会失败。"
  );
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number>;
}

/**
 * @param path
 */
export function getAuthenticatedSrc(path: string): string {
  if (!path) return "";
  if (!API_KEY) {
    console.warn("getAuthenticatedSrc: 缺少 API Key");
    return "";
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const separator = normalizedPath.includes("?") ? "&" : "?";

  return `${API_BASE_URL}${normalizedPath}${separator}key=${API_KEY}`;
}

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, headers, ...customConfig } = options;

  let url = `${API_BASE_URL}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  const config: RequestInit = {
    ...customConfig,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY || "",
      ...headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      if (response.status === 401) {
        console.error("API 认证失败：请检查 API Key 配置");
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    console.error(`Request failed: ${url}`, error);
    throw error;
  }
}
