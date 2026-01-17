import { toast } from "@/components/ui/use-toast";

// Human-friendly error messages for common database/API errors
const ERROR_MESSAGES: Record<string, string> = {
  // PostgreSQL errors
  "23505": "This record already exists. Please check for duplicates.",
  "23503": "Cannot complete this action because it references other data.",
  "23502": "Required information is missing. Please fill in all required fields.",
  "23514": "The data provided does not meet the requirements.",
  "42P01": "A system error occurred. Please contact support.",
  "42703": "A system error occurred. Please contact support.",
  "28P01": "Authentication failed. Please try again.",
  "3D000": "Database connection error. Please try again later.",
  "57P03": "The server is temporarily unavailable. Please try again later.",
  "40001": "The operation was interrupted. Please try again.",
  "40P01": "A conflict occurred. Please try again.",
  // Network errors
  NETWORK_ERROR: "Network error. Please check your internet connection.",
  TIMEOUT: "The request timed out. Please try again.",
  // Auth errors
  UNAUTHORIZED: "You are not authorized to perform this action.",
  FORBIDDEN: "You do not have permission to access this resource.",
  NOT_FOUND: "The requested resource was not found.",
  // Generic
  UNKNOWN: "An unexpected error occurred. Please try again.",
};

// Parse error response to get human-friendly message
function parseErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    // Check for PostgreSQL error codes in message
    const pgCodeMatch = error.message.match(/code[:\s]*["']?(\w+)["']?/i);
    if (pgCodeMatch && ERROR_MESSAGES[pgCodeMatch[1]]) {
      return ERROR_MESSAGES[pgCodeMatch[1]];
    }
    return error.message;
  }

  if (error && typeof error === "object") {
    const err = error as Record<string, unknown>;

    // Check for PostgreSQL error code
    if (err.code && typeof err.code === "string" && ERROR_MESSAGES[err.code]) {
      return ERROR_MESSAGES[err.code];
    }

    // Check for error message in various formats
    if (err.error && typeof err.error === "string") {
      return err.error;
    }
    if (err.message && typeof err.message === "string") {
      return err.message;
    }
    if (err.detail && typeof err.detail === "string") {
      return err.detail;
    }
  }

  return ERROR_MESSAGES.UNKNOWN;
}

// Parse HTTP status codes to human-friendly messages
function getHttpErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return "Invalid request. Please check your input.";
    case 401:
      return ERROR_MESSAGES.UNAUTHORIZED;
    case 403:
      return ERROR_MESSAGES.FORBIDDEN;
    case 404:
      return ERROR_MESSAGES.NOT_FOUND;
    case 409:
      return "A conflict occurred. The resource may have been modified.";
    case 422:
      return "The data provided is invalid.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    case 500:
      return "Server error. Please try again later.";
    case 502:
    case 503:
    case 504:
      return "The server is temporarily unavailable. Please try again later.";
    default:
      return ERROR_MESSAGES.UNKNOWN;
  }
}

// Toast utility functions using shadcn toast
export const showToast = {
  success: (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "success",
    });
  },

  error: (error: unknown, fallbackMessage?: string) => {
    const message = parseErrorMessage(error) || fallbackMessage || ERROR_MESSAGES.UNKNOWN;
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  },

  httpError: (status: number, error?: unknown) => {
    const message = error ? parseErrorMessage(error) : getHttpErrorMessage(status);
    toast({
      title: "Error",
      description: message,
      variant: "destructive",
    });
  },

  info: (title: string, description?: string) => {
    toast({
      title,
      description,
    });
  },

  warning: (title: string, description?: string) => {
    toast({
      title,
      description,
    });
  },

  // Convenience methods for common CRUD operations
  saved: (itemName?: string) => {
    toast({
      title: "Saved",
      description: itemName ? `${itemName} saved successfully` : "Saved successfully",
      variant: "success",
    });
  },

  created: (itemName?: string) => {
    toast({
      title: "Created",
      description: itemName ? `${itemName} created successfully` : "Created successfully",
      variant: "success",
    });
  },

  updated: (itemName?: string) => {
    toast({
      title: "Updated",
      description: itemName ? `${itemName} updated successfully` : "Updated successfully",
      variant: "success",
    });
  },

  deleted: (itemName?: string) => {
    toast({
      title: "Deleted",
      description: itemName ? `${itemName} deleted successfully` : "Deleted successfully",
      variant: "success",
    });
  },
};

export { parseErrorMessage, getHttpErrorMessage };
