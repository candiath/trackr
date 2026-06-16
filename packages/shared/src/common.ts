/**
 * Generic API response wrapper.
 *
 * Why: every successful response travels as { data } and errors as { error }.
 * Having a single type stops each endpoint from inventing its own shape and lets
 * the frontend HTTP client always unwrap the same way.
 */
export interface ApiResponse<T> {
  data: T;
  error?: string;
}
