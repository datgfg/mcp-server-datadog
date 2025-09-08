import { z } from 'zod'

export const QueryMetricsZodSchema = z.object({
  from: z
    .number()
    .describe(
      'Start of the queried time period, seconds since the Unix epoch.',
    ),
  to: z
    .number()
    .describe('End of the queried time period, seconds since the Unix epoch.'),
  query: z
    .string()
    .describe('Datadog metrics query string. e.g. "avg:system.cpu.user{*}'),
})

export type QueryMetricsArgs = z.infer<typeof QueryMetricsZodSchema>

// Schema for listing all metrics
export const ListMetricsZodSchema = z.object({
  from: z
    .number()
    .optional()
    .describe(
      'Start of the timeframe (in seconds since Unix epoch) to list active metrics. Defaults to 24h ago if omitted.',
    ),
  tagFilter: z
    .string()
    .optional()
    .describe('Filter metrics that have been submitted with the given tags.'),
})

export type ListMetricsArgs = z.infer<typeof ListMetricsZodSchema>
