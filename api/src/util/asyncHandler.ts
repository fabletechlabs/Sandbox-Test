import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wrap an async route handler so rejected promises are forwarded to Express's
 * error middleware instead of crashing or hanging the request.
 * @param fn - The async request handler.
 * @return A handler that catches and forwards errors.
 */
export const ah =
  (fn: RequestHandler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
