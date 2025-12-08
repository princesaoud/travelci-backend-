/**
 * Custom error classes for the application
 * Following Clean Architecture principles with domain-level exceptions
 */

/**
 * Base application error
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 - Resource not found
 */
export class NotFoundException extends AppError {
  constructor(message: string = 'Ressource non trouvée') {
    super(message, 404, 'NOT_FOUND', true);
  }
}

/**
 * 400 - Validation error
 */
export class ValidationException extends AppError {
  constructor(message: string = 'Erreur de validation') {
    super(message, 400, 'VALIDATION_ERROR', true);
  }
}

/**
 * 401 - Unauthorized
 */
export class UnauthorizedException extends AppError {
  constructor(message: string = 'Non autorisé') {
    super(message, 401, 'UNAUTHORIZED', true);
  }
}

/**
 * 403 - Forbidden
 */
export class ForbiddenException extends AppError {
  constructor(message: string = 'Accès interdit') {
    super(message, 403, 'FORBIDDEN', true);
  }
}

/**
 * 400 - Business rule violation
 */
export class BusinessRuleException extends AppError {
  constructor(message: string = 'Règle métier violée', inner?: Error) {
    super(message, 400, 'BUSINESS_RULE_ERROR', true);
    if (inner) {
      this.stack = inner.stack;
    }
  }
}

/**
 * 500 - Infrastructure/technical error
 */
export class InfrastructureException extends AppError {
  constructor(message: string = 'Erreur d\'infrastructure', inner?: Error) {
    super(message, 500, 'INFRASTRUCTURE_ERROR', true);
    if (inner) {
      this.stack = inner.stack;
    }
  }
}

