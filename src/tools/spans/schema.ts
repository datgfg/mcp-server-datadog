import { z } from 'zod'

export const ListSpansZodSchema = z.object({
  query: z
    .string()
    .default('*')
    .describe('Search query following spans syntax'),
  from: z
    .number()
    .describe('Minimum timestamp for requested spans (epoch seconds)'),
  to: z
    .number()
    .describe('Maximum timestamp for requested spans (epoch seconds)'),
  sort: z
    .enum(['timestamp', '-timestamp'])
    .optional()
    .default('-timestamp')
    .describe('Order of spans in results'),
  cursor: z
    .string()
    .optional()
    .describe('Pagination cursor from previous request'),
  limit: z
    .number()
    .optional()
    .default(100)
    .describe('Maximum number of spans to return'),
})

export type ListSpansArgs = z.infer<typeof ListSpansZodSchema>
