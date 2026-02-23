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
const webAppEmbedUrl = new URL(webAppUrl);
webAppEmbedUrl.searchParams.set('embed', '1');

const server = new McpServer({
  name: 'webp-master',
  version: '0.1.0',
});

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
      'openai/toolInvocation/invoking': 'WebP 변환기 링크 준비 중...',
      'openai/toolInvocation/invoked': 'WebP 변환기 링크를 준비했습니다.',
    },
  },
  async ({ quality }) => {
    const url = new URL(webAppEmbedUrl.toString());
    if (quality !== undefined) {
      url.searchParams.set('quality', String(quality));
    }

    return {
      content: [
        {
          type: 'text',
          text: `WebP 변환기 링크입니다. 새 탭에서 열어 사용하세요: ${url.toString()}`,
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
