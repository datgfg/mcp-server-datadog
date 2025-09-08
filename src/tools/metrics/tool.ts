import { ExtendedTool, ToolHandlers } from '../../utils/types'
import { v1 } from '@datadog/datadog-api-client'
import { createToolSchema } from '../../utils/tool'
import { QueryMetricsZodSchema, ListMetricsZodSchema } from './schema'

type MetricsToolName = 'query_metrics' | 'list_metrics'
type MetricsTool = ExtendedTool<MetricsToolName>

export const METRICS_TOOLS: MetricsTool[] = [
  createToolSchema(
    QueryMetricsZodSchema,
    'query_metrics',
    'Query timeseries points of metrics from Datadog',
  ),
  createToolSchema(
    ListMetricsZodSchema,
    'list_metrics',
    'List active metric names from Datadog',
  ),
] as const

type MetricsToolHandlers = ToolHandlers<MetricsToolName>

export const createMetricsToolHandlers = (
  apiInstance: v1.MetricsApi,
): MetricsToolHandlers => {
  return {
    query_metrics: async (request) => {
      const { from, to, query } = QueryMetricsZodSchema.parse(
        request.params.arguments,
      )

      const response = await apiInstance.queryMetrics({
        from,
        to,
        query,
      })

      return {
        content: [
          {
            type: 'text',
            text: `Queried metrics data: ${JSON.stringify({ response })}`,
          },
        ],
      }
    },
    list_metrics: async (request) => {
      const { from, tagFilter } = ListMetricsZodSchema.parse(
        request.params.arguments,
      )

      // default to 24h ago if from not provided
      const fromSeconds = from ?? Math.floor(Date.now() / 1000) - 60 * 60 * 24

      const response = await apiInstance.listActiveMetrics({
        from: fromSeconds,
        tagFilter,
      })

      const metrics = response.metrics as string[]

      return {
        content: [
          {
            type: 'text',
            text: `Metrics: ${JSON.stringify(metrics)}`,
          },
        ],
      }
    },
  }
}
