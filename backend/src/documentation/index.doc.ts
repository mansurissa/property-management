import { Router } from 'express';
import { serve, setup } from 'swagger-ui-express';

const docRouter = Router();

const swaggerDocument = {
  openapi: '3.0.1',
  info: {
    title: 'API',
    version: '1.0.0',
    description: 'API documentation for web Website Backend',

    license: {
      name: 'ISC',
      url: 'https://opensource.org/licenses/ISC'
    }
  },
  servers: [
    {
      url: 'http://localhost:4000/api/v1',
      description: 'Development server'
    }
  ],
  tags: [
    { name: 'Auth', description: 'Authentication and authorization endpoints' }
  ],
  paths: {
    '/auth/signin': {
      post: {
        tags: ['Auth'],
        summary: 'Login user',
        description: 'Authenticate user with email and password',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SigninRequest' },
              example: {
                email: 'john.doe@example.com',
                password: 'SecurePass@123'
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' }
              }
            }
          },
          401: { description: 'Invalid credentials' },
          500: { description: 'Internal server error' }
        }
      }
    }
  },

  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT authorization token. Format: Bearer {token}'
      }
    },

    schemas: {
      // Error Schema
      Error: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          error: { type: 'string' }
        }
      },

      SigninRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'john.doe@example.com'
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'SecurePass@123'
          }
        }
      }
    }
  }
};

docRouter.use('/', serve, setup(swaggerDocument));

export default docRouter;
