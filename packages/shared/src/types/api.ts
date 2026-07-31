// ─── API response wrapper ──────────────────────────────────
export interface APIResponse<T> {
  success: boolean;
  data: T | null;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    request_id: string;
  };
}

// ─── Paginated response ────────────────────────────────────
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ─── Error codes ───────────────────────────────────────────
export const ERROR_CODES = {
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  PLAN_RESTRICTED: 'PLAN_RESTRICTED',
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  GENERATION_IN_PROGRESS: 'GENERATION_IN_PROGRESS',
  RATE_LIMITED: 'RATE_LIMITED',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
