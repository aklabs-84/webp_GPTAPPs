import 'dotenv/config';
import express from 'express';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => {
  res.status(200).send('webp-master MCP server is running');
});

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

const webAppUrl = process.env.WEB_APP_URL;
if (!webAppUrl) {
  throw new Error('WEB_APP_URL is required. Set it before running the MCP server.');
}
const webAppOrigin = new URL(webAppUrl).origin;

const server = new McpServer({
  name: 'webp-master',
  version: '0.1.0',
});

server.registerResource(
  'webp_widget',
  'ui://webp/widget.html',
  {},
  async () => ({
    contents: [
      {
        uri: 'ui://webp/widget.html',
        mimeType: 'text/html',
        text: `
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>WebP Master</title>
    <style>
      html, body { margin: 0; padding: 0; height: 100%; background: #0a0f1a; }
      .frame-wrap { height: 100vh; min-height: 560px; width: 100%; }
      iframe { border: 0; width: 100%; height: 100%; background: #0a0f1a; }
    </style>
  </head>
  <body>
    <div class="frame-wrap">
      <iframe src="${webAppUrl}" allow="clipboard-write"></iframe>
    </div>
  </body>
</html>`.trim(),
        _meta: {
          'openai/widgetDescription': 'WebP 이미지를 브라우저에서 직접 변환하는 인터페이스',
          'openai/widgetPrefersBorder': true,
          'openai/widgetCSP': {
            connect_domains: [webAppOrigin],
            resource_domains: [webAppOrigin],
          },
          'openai/widgetDomain': webAppOrigin,
        },
      },
    ],
  })
);

server.registerTool(
  'open_webp_converter',
  {
    title: 'Open WebP Master',
    description: 'Open the WebP Master UI to convert JPG/PNG files to WebP in your browser.',
    inputSchema: {
      quality: z
        .number()
        .min(0.1)
        .max(1)
        .optional()
        .describe('Initial quality value (0.1 to 1.0).'),
    },
    _meta: {
      'openai/outputTemplate': 'ui://webp/widget.html',
      'openai/toolInvocation/invoking': 'WebP 변환기 여는 중...',
      'openai/toolInvocation/invoked': 'WebP 변환기가 열렸습니다.',
    },
  },
  async ({ quality }) => {
    const url = new URL(webAppUrl);
    if (quality !== undefined) {
      url.searchParams.set('quality', String(quality));
    }

    return {
      content: [
        {
          type: 'text',
          text: `WebP 변환기를 열었습니다: ${url.toString()}`,
        },
      ],
      structuredContent: {
        web_app_url: url.toString(),
      },
    };
  }
);

app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  res.on('close', () => {
    transport.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

const port = Number(process.env.PORT || 8787);
app.listen(port, () => {
  console.log(`MCP server listening on http://localhost:${port}/mcp`);
});
