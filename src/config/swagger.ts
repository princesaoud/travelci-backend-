import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TravelCI Backend API',
      version: '1.0.0',
      description: 'API REST pour l\'application de réservation de voyages TravelCI',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Serveur de développement',
      },
      {
        url: process.env.API_URL || 'https://api.travelci.com',
        description: 'Serveur de production',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtenu via /api/auth/login ou /api/auth/register',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Identifiant unique de l\'utilisateur',
            },
            full_name: {
              type: 'string',
              description: 'Nom complet de l\'utilisateur',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email de l\'utilisateur',
            },
            phone: {
              type: 'string',
              nullable: true,
              description: 'Numéro de téléphone',
            },
            role: {
              type: 'string',
              enum: ['client', 'owner', 'admin'],
              description: 'Rôle de l\'utilisateur',
            },
            is_verified: {
              type: 'boolean',
              description: 'Statut de vérification de l\'utilisateur',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Property: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            owner_id: {
              type: 'string',
              format: 'uuid',
            },
            title: {
              type: 'string',
              description: 'Titre de la propriété',
            },
            description: {
              type: 'string',
              nullable: true,
            },
            type: {
              type: 'string',
              enum: ['apartment', 'villa'],
            },
            furnished: {
              type: 'boolean',
            },
            price_per_night: {
              type: 'number',
              description: 'Prix par nuit',
            },
            address: {
              type: 'string',
            },
            city: {
              type: 'string',
            },
            latitude: {
              type: 'number',
              nullable: true,
            },
            longitude: {
              type: 'number',
              nullable: true,
            },
            image_urls: {
              type: 'array',
              items: {
                type: 'string',
                format: 'uri',
              },
            },
            amenities: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Booking: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            property_id: {
              type: 'string',
              format: 'uuid',
            },
            client_id: {
              type: 'string',
              format: 'uuid',
            },
            start_date: {
              type: 'string',
              format: 'date',
            },
            end_date: {
              type: 'string',
              format: 'date',
            },
            nights: {
              type: 'integer',
            },
            guests: {
              type: 'integer',
            },
            message: {
              type: 'string',
              nullable: true,
            },
            total_price: {
              type: 'number',
            },
            status: {
              type: 'string',
              enum: ['pending', 'accepted', 'declined', 'cancelled'],
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
            },
            message: {
              type: 'string',
              nullable: true,
            },
            pagination: {
              type: 'object',
              nullable: true,
              properties: {
                page: {
                  type: 'integer',
                },
                limit: {
                  type: 'integer',
                },
                total: {
                  type: 'integer',
                },
                pages: {
                  type: 'integer',
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                },
                code: {
                  type: 'string',
                },
                statusCode: {
                  type: 'integer',
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Endpoints d\'authentification',
      },
      {
        name: 'Properties',
        description: 'Gestion des propriétés',
      },
      {
        name: 'Bookings',
        description: 'Gestion des réservations',
      },
      {
        name: 'Images',
        description: 'Gestion des images',
      },
      {
        name: 'Health',
        description: 'Vérification de santé du serveur',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/app.ts'], // Paths to files containing OpenAPI definitions
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'TravelCI API Documentation',
  }));

  // JSON endpoint for the spec
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};
