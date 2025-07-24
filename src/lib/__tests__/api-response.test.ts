import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '../api-response';
import { ZodError } from 'zod';

describe('API response utilities', () => {
  describe('successResponse', () => {
    it('should create success response with data', () => {
      const data = { test: 'data' };
      const response = successResponse(data);

      expect(response.status).toBe(200);

      // Check the response body structure
      const responseData = JSON.parse(JSON.stringify(response));
      expect(responseData).toMatchObject({
        success: true,
        data,
        statusCode: 200,
      });
    });

    it('should create success response with custom status code', () => {
      const data = { test: 'data' };
      const response = successResponse(data, 'Created', 201);

      expect(response.status).toBe(201);
    });

    it('should create success response with message', () => {
      const data = { test: 'data' };
      const message = 'Operation successful';
      const response = successResponse(data, message);

      const responseData = JSON.parse(JSON.stringify(response));
      expect(responseData).toMatchObject({
        success: true,
        data,
        message,
        statusCode: 200,
      });
    });
  });

  describe('errorResponse', () => {
    it('should create error response', () => {
      const error = 'Something went wrong';
      const response = errorResponse(error);

      expect(response.status).toBe(500);

      const responseData = JSON.parse(JSON.stringify(response));
      expect(responseData).toMatchObject({
        success: false,
        error,
        statusCode: 500,
      });
    });

    it('should create error response with custom status code', () => {
      const error = 'Not found';
      const response = errorResponse(error, 404);

      expect(response.status).toBe(404);

      const responseData = JSON.parse(JSON.stringify(response));
      expect(responseData).toMatchObject({
        success: false,
        error,
        statusCode: 404,
      });
    });

    it('should create error response with additional data', () => {
      const error = 'Validation failed';
      const data = { field: 'email' };
      const response = errorResponse(error, 400, data);

      expect(response.status).toBe(400);

      const responseData = JSON.parse(JSON.stringify(response));
      expect(responseData).toMatchObject({
        success: false,
        error,
        data,
        statusCode: 400,
      });
    });
  });

  describe('validationErrorResponse', () => {
    it('should create validation error response from ZodError', () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['email'],
          message: 'Expected string, received number',
        },
        {
          code: 'too_small',
          minimum: 1,
          type: 'string',
          inclusive: true,
          path: ['password'],
          message: 'String must contain at least 1 character(s)',
        },
      ]);

      const response = validationErrorResponse(zodError);

      expect(response.status).toBe(400);

      const responseData = JSON.parse(JSON.stringify(response));
      expect(responseData).toMatchObject({
        success: false,
        error: 'Validation failed',
        statusCode: 400,
        data: {
          errors: [
            {
              field: 'email',
              message: 'Expected string, received number',
            },
            {
              field: 'password',
              message: 'String must contain at least 1 character(s)',
            },
          ],
        },
      });
    });
  });
});
