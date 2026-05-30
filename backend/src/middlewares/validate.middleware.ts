import type { RequestHandler } from 'express';
import type { AnyZodObject } from 'zod';

export function validate(schema: AnyZodObject): RequestHandler {
  return (req, _res, next) => {
    schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    });
    next();
  };
}
