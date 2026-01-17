"use client";

import { useState, useCallback } from "react";
import { showToast, parseErrorMessage } from "@/lib/toast";

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number | null;
}

interface ApiRequestOptions {
  /** Show success toast on successful request */
  showSuccessToast?: boolean;
  /** Custom success message */
  successMessage?: string;
  /** Show error toast on failed request */
  showErrorToast?: boolean;
  /** Custom error message */
  errorMessage?: string;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
}

interface UseApiOptions {
  /** Base URL for API requests (default: "") */
  baseUrl?: string;
  /** Default options for all requests */
  defaultOptions?: ApiRequestOptions;
}

interface MutationOptions extends ApiRequestOptions {
  /** Item name for CRUD toast messages (e.g., "Villa", "Booking") */
  itemName?: string;
}

export function useApi(options: UseApiOptions = {}) {
  const { baseUrl = "", defaultOptions = {} } = options;
  const [isLoading, setIsLoading] = useState(false);

  const request = useCallback(
    async <T>(
      endpoint: string,
      init?: RequestInit,
      requestOptions?: ApiRequestOptions
    ): Promise<ApiResponse<T>> => {
      const opts = { ...defaultOptions, ...requestOptions };
      const {
        showSuccessToast = false,
        successMessage,
        showErrorToast = true,
        errorMessage,
        timeout = 30000,
      } = opts;

      setIsLoading(true);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
          ...init,
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            ...init?.headers,
          },
        });

        clearTimeout(timeoutId);

        let data: T | null = null;
        let error: string | null = null;

        // Try to parse response body
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const json = await response.json();
          if (response.ok) {
            data = json;
          } else {
            error = parseErrorMessage(json);
          }
        } else if (!response.ok) {
          error = response.statusText || "Request failed";
        }

        if (!response.ok) {
          if (showErrorToast) {
            showToast.httpError(response.status, error || errorMessage);
          }
          return { data: null, error, status: response.status };
        }

        if (showSuccessToast && successMessage) {
          showToast.success("Success", successMessage);
        }

        return { data, error: null, status: response.status };
      } catch (err) {
        clearTimeout(timeoutId);

        let errorMsg = "An unexpected error occurred";

        if (err instanceof Error) {
          if (err.name === "AbortError") {
            errorMsg = "Request timed out. Please try again.";
          } else if (err.message === "Failed to fetch") {
            errorMsg = "Network error. Please check your internet connection.";
          } else {
            errorMsg = err.message;
          }
        }

        if (showErrorToast) {
          showToast.error(errorMessage || errorMsg);
        }

        return { data: null, error: errorMsg, status: null };
      } finally {
        setIsLoading(false);
      }
    },
    [baseUrl, defaultOptions]
  );

  // Convenience methods for common HTTP methods
  const get = useCallback(
    <T>(endpoint: string, options?: ApiRequestOptions) => {
      return request<T>(endpoint, { method: "GET" }, options);
    },
    [request]
  );

  const post = useCallback(
    <T>(endpoint: string, body: unknown, options?: MutationOptions) => {
      const { itemName, ...restOptions } = options || {};
      return request<T>(
        endpoint,
        { method: "POST", body: JSON.stringify(body) },
        {
          showSuccessToast: !!itemName,
          successMessage: itemName ? `${itemName} created successfully` : undefined,
          ...restOptions,
        }
      );
    },
    [request]
  );

  const put = useCallback(
    <T>(endpoint: string, body: unknown, options?: MutationOptions) => {
      const { itemName, ...restOptions } = options || {};
      return request<T>(
        endpoint,
        { method: "PUT", body: JSON.stringify(body) },
        {
          showSuccessToast: !!itemName,
          successMessage: itemName ? `${itemName} updated successfully` : undefined,
          ...restOptions,
        }
      );
    },
    [request]
  );

  const patch = useCallback(
    <T>(endpoint: string, body: unknown, options?: MutationOptions) => {
      const { itemName, ...restOptions } = options || {};
      return request<T>(
        endpoint,
        { method: "PATCH", body: JSON.stringify(body) },
        {
          showSuccessToast: !!itemName,
          successMessage: itemName ? `${itemName} updated successfully` : undefined,
          ...restOptions,
        }
      );
    },
    [request]
  );

  const del = useCallback(
    <T>(endpoint: string, options?: MutationOptions) => {
      const { itemName, ...restOptions } = options || {};
      return request<T>(
        endpoint,
        { method: "DELETE" },
        {
          showSuccessToast: !!itemName,
          successMessage: itemName ? `${itemName} deleted successfully` : undefined,
          ...restOptions,
        }
      );
    },
    [request]
  );

  return {
    isLoading,
    request,
    get,
    post,
    put,
    patch,
    del,
  };
}

// Standalone API functions for use outside of React components
export const api = {
  async request<T>(
    endpoint: string,
    init?: RequestInit,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    const {
      showSuccessToast = false,
      successMessage,
      showErrorToast = true,
      errorMessage,
      timeout = 30000,
    } = options || {};

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(endpoint, {
        ...init,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          ...init?.headers,
        },
      });

      clearTimeout(timeoutId);

      let data: T | null = null;
      let error: string | null = null;

      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const json = await response.json();
        if (response.ok) {
          data = json;
        } else {
          error = parseErrorMessage(json);
        }
      } else if (!response.ok) {
        error = response.statusText || "Request failed";
      }

      if (!response.ok) {
        if (showErrorToast) {
          showToast.httpError(response.status, error || errorMessage);
        }
        return { data: null, error, status: response.status };
      }

      if (showSuccessToast && successMessage) {
        showToast.success(successMessage);
      }

      return { data, error: null, status: response.status };
    } catch (err) {
      clearTimeout(timeoutId);

      let errorMsg = "An unexpected error occurred";

      if (err instanceof Error) {
        if (err.name === "AbortError") {
          errorMsg = "Request timed out. Please try again.";
        } else if (err.message === "Failed to fetch") {
          errorMsg = "Network error. Please check your internet connection.";
        } else {
          errorMsg = err.message;
        }
      }

      if (showErrorToast) {
        showToast.error(errorMessage || errorMsg);
      }

      return { data: null, error: errorMsg, status: null };
    }
  },

  get<T>(endpoint: string, options?: ApiRequestOptions) {
    return this.request<T>(endpoint, { method: "GET" }, options);
  },

  post<T>(endpoint: string, body: unknown, options?: MutationOptions) {
    const { itemName, ...restOptions } = options || {};
    return this.request<T>(
      endpoint,
      { method: "POST", body: JSON.stringify(body) },
      {
        showSuccessToast: !!itemName,
        successMessage: itemName ? `${itemName} created successfully` : undefined,
        ...restOptions,
      }
    );
  },

  put<T>(endpoint: string, body: unknown, options?: MutationOptions) {
    const { itemName, ...restOptions } = options || {};
    return this.request<T>(
      endpoint,
      { method: "PUT", body: JSON.stringify(body) },
      {
        showSuccessToast: !!itemName,
        successMessage: itemName ? `${itemName} updated successfully` : undefined,
        ...restOptions,
      }
    );
  },

  patch<T>(endpoint: string, body: unknown, options?: MutationOptions) {
    const { itemName, ...restOptions } = options || {};
    return this.request<T>(
      endpoint,
      { method: "PATCH", body: JSON.stringify(body) },
      {
        showSuccessToast: !!itemName,
        successMessage: itemName ? `${itemName} updated successfully` : undefined,
        ...restOptions,
      }
    );
  },

  del<T>(endpoint: string, options?: MutationOptions) {
    const { itemName, ...restOptions } = options || {};
    return this.request<T>(
      endpoint,
      { method: "DELETE" },
      {
        showSuccessToast: !!itemName,
        successMessage: itemName ? `${itemName} deleted successfully` : undefined,
        ...restOptions,
      }
    );
  },
};
