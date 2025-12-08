import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ValidationException } from '../utils/errors';
import { sendError } from '../utils/responses';

/**
 * Validate request using express-validator
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((err) => err.msg).join(', ');
      sendError(res, errorMessages, 'VALIDATION_ERROR', 400);
      return;
    }

    next();
  };
};

/**
 * Validate request body
 */
export const validateBody = (validations: ValidationChain[]) => {
  return validate(validations);
};

/**
 * Validate request query parameters
 */
export const validateQuery = (validations: ValidationChain[]) => {
  return validate(validations);
};

/**
 * Validate request params
 */
export const validateParams = (validations: ValidationChain[]) => {
  return validate(validations);
};

