import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { BadRequestError } from '../utils/errors';

/**
 * Validate incoming request schema using Zod
 */
export function validateRequest(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Parse body, query, and params against Zod schema
      const parsed = (await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })) as any;
      
      // Update request with parsed/typed data
      if (parsed.body) {
        req.body = parsed.body;
      }
      if (parsed.query) {
        Object.assign(req.query, parsed.query);
      }
      if (parsed.params) {
        Object.assign(req.params, parsed.params);
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors to return standard message and paths
        const validationErrors = error.issues.map((err) => ({
          field: err.path.slice(1).join('.') || 'root', // Remove the outer 'body'/'query'/'params' container
          message: err.message,
        }));
        next(new BadRequestError('Request validation failed', validationErrors));
      } else {
        next(error);
      }
    }
  };
}
