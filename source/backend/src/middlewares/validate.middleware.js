import { ValidationError } from '../utils/errors.js';

/**
 * Middleware validate request data bằng Zod schema.
 * Tham chiếu: docs/02-system-design/backend/04-error-handling.md
 *
 * Sử dụng:
 *   router.post('/users', validate({ body: createUserSchema }), controller);
 *
 * Schema format: { body?: ZodSchema, query?: ZodSchema, params?: ZodSchema }
 * Nếu validate pass → replace req.body/query/params bằng data đã parse (strip unknown).
 * Nếu fail → next(ValidationError) với details array.
 */
export const validate = (schema) => (req, res, next) => {
  const errors = [];

  // Validate từng phần: body, query, params
  for (const source of ['body', 'query', 'params']) {
    if (!schema[source]) continue;

    const result = schema[source].safeParse(req[source]);

    if (!result.success) {
      // Chuyển Zod errors thành format chuẩn: [{ field, message }]
      const fieldErrors = result.error.issues.map((issue) => ({
        field: `${source}.${issue.path.join('.')}`,
        message: issue.message,
      }));
      errors.push(...fieldErrors);
    } else {
      // Replace bằng data đã validate (strip unknown fields)
      req[source] = result.data;
    }
  }

  if (errors.length > 0) {
    return next(new ValidationError('Dữ liệu không hợp lệ', errors));
  }

  return next();
};
