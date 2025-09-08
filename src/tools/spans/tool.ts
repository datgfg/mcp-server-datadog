import { ExtendedTool, ToolHandlers } from '../../utils/types'
import { v2 } from '@datadog/datadog-api-client'
import { createToolSchema } from '../../utils/tool'
import { ListSpansZodSchema } from './schema'

type SpansToolName = 'list_spans'
type SpansTool = ExtendedTool<SpansToolName>

export const SPANS_TOOLS: SpansTool[] = [
  createToolSchema(
    ListSpansZodSchema,
    'list_spans',
    'Get a list of spans matching a search query',
  ),
] as const

type SpansToolHandlers = ToolHandlers<SpansToolName>

export const createSpansToolHandlers = (
  apiInstance: v2.SpansApi,
): SpansToolHandlers => ({
  list_spans: async (request) => {
    const { query, from, to, sort, cursor, limit } = ListSpansZodSchema.parse(
      request.params.arguments,
    )

    const response = await apiInstance.listSpans({
      body: {
        data: {
          attributes: {
            filter: {
              query,
              from: new Date(from * 1000).toISOString(),
              to: new Date(to * 1000).toISOString(),
            },
            sort: sort as 'timestamp' | '-timestamp',
            page: {
              limit,
              cursor: cursor ?? undefined,
            },
          },
          type: 'search_request',
        },
      },
    })

    if (response.data == null) {
      throw new Error('No spans data returned')
    }

    return {
      content: [
        {
          type: 'text',
          text: `Spans: ${JSON.stringify({
            spans: response.data,
            nextCursor: (response.meta as any)?.page?.after ?? null,
            count: response.data.length,
          })}`,
        },
      ],
    }
  },
})
