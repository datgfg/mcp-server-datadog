import { v2 } from '@datadog/datadog-api-client'
import { describe, it, expect } from 'vitest'
import { createDatadogConfig } from '../../src/utils/datadog'
import { createSpansToolHandlers } from '../../src/tools/spans/tool'
import { createMockToolRequest } from '../helpers/mock'
import { http, HttpResponse } from 'msw'
import { setupServer } from '../helpers/msw'
import { baseUrl, DatadogToolResponse } from '../helpers/datadog'

const spansEndpoint = `${baseUrl}/v2/spans/events/search`

describe('Spans Tool', () => {
  if (!process.env.DATADOG_API_KEY || !process.env.DATADOG_APP_KEY) {
    throw new Error('DATADOG_API_KEY and DATADOG_APP_KEY must be set')
  }

  const datadogConfig = createDatadogConfig({
    apiKeyAuth: process.env.DATADOG_API_KEY,
    appKeyAuth: process.env.DATADOG_APP_KEY,
    site: process.env.DATADOG_SITE,
  })

  const apiInstance = new v2.SpansApi(datadogConfig)
  const toolHandlers = createSpansToolHandlers(apiInstance)

  // https://docs.datadoghq.com/api/latest/spans/#get-a-list-of-spans
  describe.concurrent('list_spans', async () => {
    it('should list spans with basic query', async () => {
      const mockHandler = http.post(spansEndpoint, async () => {
        return HttpResponse.json({
          data: [
            {
              id: 'span-id-1',
              type: 'spans',
              attributes: {
                service: 'web-api',
                name: 'http.request',
                resource: 'GET /api/users',
                trace_id: 'trace-id-1',
                span_id: 'span-id-1',
              },
            },
          ],
          meta: { page: { after: 'cursor-1' } },
        })
      })

      const server = setupServer(mockHandler)

      await server.boundary(async () => {
        const request = createMockToolRequest('list_spans', {
          query: 'service:web-api',
          from: 1640995000,
          to: 1640996000,
          limit: 10,
        })
        const response = (await toolHandlers.list_spans(
          request,
        )) as unknown as DatadogToolResponse

        expect(response.content[0].text).toContain('Spans:')
        expect(response.content[0].text).toContain('web-api')
        expect(response.content[0].text).toContain('cursor-1')
        expect(response.content[0].text).toContain('count":1')
      })()

      server.close()
    })

    it('should handle empty spans response', async () => {
      const mockHandler = http.post(spansEndpoint, async () => {
        return HttpResponse.json({ data: [], meta: { page: {} } })
      })

      const server = setupServer(mockHandler)

      await server.boundary(async () => {
        const request = createMockToolRequest('list_spans', {
          query: '*',
          from: 1640995000,
          to: 1640996000,
        })
        const response = (await toolHandlers.list_spans(
          request,
        )) as unknown as DatadogToolResponse

        expect(response.content[0].text).toContain('Spans:')
        expect(response.content[0].text).toContain('count":0')
      })()

      server.close()
    })

    it('should throw when response data is null', async () => {
      const mockHandler = http.post(spansEndpoint, async () => {
        return HttpResponse.json({ data: null })
      })

      const server = setupServer(mockHandler)

      await server.boundary(async () => {
        const request = createMockToolRequest('list_spans', {
          query: '*',
          from: 1640995000,
          to: 1640996000,
        })
        await expect(toolHandlers.list_spans(request)).rejects.toThrow(
          'No spans data returned',
        )
      })()

      server.close()
    })
  })
})
