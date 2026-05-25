/**
 * Centralized utility for extracting error messages from API responses.
 * Replaces complex manual parsing in forms.
 */
export const getErrorMessage = (error) => {
  // If it's a validation error array from our standardized backend
  if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    // Return all validation messages joined by a newline
    return error.response.data.errors.map(err => err.msg || err.message).join('\n');
  }

  // If it's a standardized single message from our backend
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // Handle specific status codes
  if (error?.response?.status === 429) {
    return 'Too many requests. Please try again later.';
  }
  if (error?.response?.status === 401) {
    return 'Invalid credentials or session expired.';
  }

  // Handle network/connection issues
  if (error?.message === 'Network Error' || error?.code === 'ECONNREFUSED') {
    return 'Network error. Cannot connect to the server. Please check if the backend is running.';
  }

  // Fallback to standard JS error message
  if (error?.message) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
};
