export enum DatabaseErrorType {
  NOT_FOUND = "NOT_FOUND",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  ALREADY_EXISTS = "ALREADY_EXISTS",
  UNAUTHENTICATED = "UNAUTHENTICATED",
  INVALID_ARGUMENT = "INVALID_ARGUMENT",
  UNKNOWN = "UNKNOWN",
}

/**
 * Custom strongly-typed database error class
 */
export class DatabaseError extends Error {
  type: DatabaseErrorType;
  originalError?: any;

  constructor(type: DatabaseErrorType, message: string, originalError?: any) {
    super(message);
    this.name = "DatabaseError";
    this.type = type;
    this.originalError = originalError;
    // Maintains proper stack trace in V8 engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DatabaseError);
    }
  }
}

/**
 * Centralized mapping function that translates Firestore exceptions
 * into structured typed errors with user-friendly messages.
 */
export function handleFirestoreError(error: any): DatabaseError {
  // Log unexpected errors internally for developer debugging
  console.warn("Firestore error captured:", error?.code || error?.message || error);

  const code = error?.code;
  let type = DatabaseErrorType.UNKNOWN;
  let message = "An unexpected database error occurred. Please try again.";

  switch (code) {
    case "permission-denied":
      type = DatabaseErrorType.PERMISSION_DENIED;
      message = "You do not have permission to access or modify this record.";
      break;
    case "not-found":
      type = DatabaseErrorType.NOT_FOUND;
      message = "The requested database record was not found.";
      break;
    case "already-exists":
      type = DatabaseErrorType.ALREADY_EXISTS;
      message = "This record already exists in the database.";
      break;
    case "unauthenticated":
      type = DatabaseErrorType.UNAUTHENTICATED;
      message = "You must be signed in to perform this database operation.";
      break;
    case "invalid-argument":
      type = DatabaseErrorType.INVALID_ARGUMENT;
      message = "Invalid query arguments or fields were supplied.";
      break;
    case "unavailable":
      type = DatabaseErrorType.UNKNOWN;
      message = "The database service is currently offline or unreachable. Please check your connection.";
      break;
  }

  return new DatabaseError(type, message, error);
}
