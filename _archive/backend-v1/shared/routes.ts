import { z } from 'zod';
import { insertVisitSchema, visits } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    me: {
      method: 'GET' as const,
      path: '/api/me',
      responses: {
        200: z.object({
          user: z.any(), // User from auth
          role: z.enum(["doctor", "assistant"]).optional(),
        }),
        401: errorSchemas.unauthorized,
      },
    }
  },
  visits: {
    list: {
      method: 'GET' as const,
      path: '/api/visits',
      input: z.object({
        date: z.string().optional(), // ISO date string YYYY-MM-DD
        range: z.enum(["today", "week", "month", "custom"]).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof visits.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/visits/:id',
      responses: {
        200: z.custom<typeof visits.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/visits',
      input: insertVisitSchema,
      responses: {
        201: z.custom<typeof visits.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/visits/:id',
      input: insertVisitSchema.partial(),
      responses: {
        200: z.custom<typeof visits.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/visits/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        403: errorSchemas.unauthorized,
      },
    },
  },
  analytics: {
    get: {
      method: 'GET' as const,
      path: '/api/analytics',
      input: z.object({
        startDate: z.string(),
        endDate: z.string(),
      }),
      responses: {
        200: z.object({
          totalPatients: z.number(),
          totalRevenue: z.number(),
          averagePrice: z.number(),
          patientsPerDay: z.array(z.object({
            date: z.string(),
            total: z.number(),
            mutuelle: z.number(),
            mutuelleRemplie: z.number(),
          })),
        }),
        403: errorSchemas.unauthorized,
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export const ws = {
  // Client sends these
  send: {
    // No specific client-to-server events needed for MVP besides standard API calls triggering updates
  },
  // Server broadcasts these
  receive: {
    visitUpdate: z.object({ type: z.literal("UPDATE"), data: z.custom<typeof visits.$inferSelect>() }),
    visitCreate: z.object({ type: z.literal("CREATE"), data: z.custom<typeof visits.$inferSelect>() }),
    visitDelete: z.object({ type: z.literal("DELETE"), id: z.number() }),
  },
};
