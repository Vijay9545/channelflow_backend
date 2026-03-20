"use strict"
export const resMessage = {
  INTERNAL_SERVER_ERROR: "Oops! Something went wrong on our end. We're working on it—please refresh or try again later.!",
  NO_TOKEN_PROVIDED: "Authentication token is missing. Please log in.!",
  UNAUTHORIZED: "You are not authorized to perform this action.!",
  TOKEN_EXPIRED: "Your session has expired. Please log in again.!",
  ACCESS_DENIED: "Access Denied!",
  TOKEN_INVALID: "Invalid authentication token. Please log in again.!",
  MOBILE_NO: "Phone number not found in token",
  USER_FOUND: "An account with this email already exists!",
  ONBOARD_USER: "Welcome! You have successfully signed in.",
  USER_NOT_FOUND: "You don't have an account yet. Please sign up first!",

  CONFLICT_FOUND: 'Action could not be completed due to a conflict.',
  ACTION_COMPLETE: "Action completed successfully!",
  VARIANTS_INVALID: "Variants must be an object with distributor, retailer and customer!"
};

export const resStatusCode = {
  ACTION_COMPLETE: 200, // OK
  CREATED: 201, // Resource created successfully
  ACCEPTED: 202, // Request accepted but processing not complete
  NO_CONTENT: 204, // No content to send back
  CLIENT_ERROR: 400, // Bad request
  UNAUTHORIZED: 401, // UNAUTHORIZED
  FORBIDDEN: 403, // Forbidden
  NOT_FOUND: 404, // Resource not found
  CONFLICT: 409, // Conflict
  UNSUPPORTED_MEDIA_TYPE: 415, // Unsupported content type
  TOO_MANY_REQUESTS: 429, // Rate limit exceeded
  INTERNAL_SERVER_ERROR: 500, // Generic server error
  NOT_IMPLEMENTED: 501, // Not implemented on server
  SERVICE_UNAVAILABLE: 503, // Server temporarily unavailable
  GATEWAY_TIMEOUT: 504, // Gateway timeout (useful for proxy setups)
  INVALID_TOKEN: 505, // invalid or expric token
};

export const dbTableName = {
  USER: "users",
  CATEGORY: "categorys",
  SUB_CATEGORY: "sub_categorys",
  PRODUCT: "products",
  CART: "carts",
  ORDER: "orders",
  REWARD: "rewards"
};
