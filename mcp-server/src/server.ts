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

const fallbackWebUrl = process.env.WEB_APP_URL;

const server = new McpServer({
  name: 'webp-master',
  version: '0.1.0',
});

server.registerResource('webp_widget', 'ui://webp/widget.html', {}, async () => ({
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
    <title>WebP Master Widget</title>
    <style>
      :root {
        --bg: #0b1220;
        --panel: #111827;
        --muted: #94a3b8;
        --text: #e2e8f0;
        --line: #1f2937;
        --accent: #38bdf8;
        --accent2: #10b981;
      }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text); font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      .wrap { width: 100%; max-width: 920px; margin: 0 auto; padding: 14px; }
      .head { margin-bottom: 12px; }
      .title { margin: 0 0 6px; font-size: 20px; font-weight: 700; }
      .sub { margin: 0; color: var(--muted); font-size: 12px; }
      .card { background: linear-gradient(180deg, #111827 0%, #0f172a 100%); border: 1px solid var(--line); border-radius: 14px; padding: 12px; margin-bottom: 12px; }
      .drop { border: 1px dashed #334155; border-radius: 12px; padding: 16px; text-align: center; cursor: pointer; }
      .drop:hover { border-color: var(--accent); }
      .small { color: var(--muted); font-size: 12px; }
      .row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
      .grow { flex: 1; }
      .btn { border: 0; border-radius: 10px; padding: 10px 12px; color: #0b1220; background: #f8fafc; font-weight: 700; cursor: pointer; }
      .btn:disabled { opacity: 0.4; cursor: default; }
      .btn.secondary { color: #cbd5e1; background: #1f2937; font-weight: 600; }
      .qv { min-width: 48px; text-align: right; color: #7dd3fc; font-weight: 700; }
      .list { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
      .item { border: 1px solid var(--line); border-radius: 12px; padding: 10px; background: #0f172a; }
      .name { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .meta { color: var(--muted); font-size: 11px; margin-top: 5px; }
      .item-actions { margin-top: 8px; display: flex; gap: 8px; }
      .ok { color: #34d399; font-weight: 700; }
      .err { color: #fca5a5; font-weight: 700; }
      .status { color: #93c5fd; font-weight: 700; }
      input[type="range"] { width: 100%; }
      @media (max-width: 640px) {
        .title { font-size: 18px; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="head">
        <h1 class="title">WebP Master for ChatGPT</h1>
        <p class="sub">채팅 안에서 바로 이미지 업로드 후 WebP로 변환하세요.</p>
      </div>

      <div class="card">
        <label class="small">품질 (Quality)</label>
        <div class="row" style="margin-top:6px;">
          <input id="quality" class="grow" type="range" min="0.1" max="1" step="0.05" value="0.8" />
          <div id="qv" class="qv">80%</div>
        </div>
      </div>

      <div class="card">
        <div id="drop" class="drop">
          <div>이미지를 드래그하거나 클릭해서 선택</div>
          <div class="small" style="margin-top:6px;">JPG, PNG, GIF, WEBP | 다중 선택 가능</div>
        </div>
        <input id="file" type="file" accept="image/*" multiple style="display:none;" />
        <div class="row" style="margin-top:10px;">
          <button id="zip" class="btn" disabled>ZIP 다운로드 (0)</button>
          <button id="clear" class="btn secondary" disabled>목록 비우기</button>
          <a id="fallbackLink" class="small" href="#" target="_blank" rel="noopener noreferrer" style="margin-left:auto; display:none;">전체 웹 버전 열기</a>
        </div>
      </div>

      <div id="list" class="list"></div>
    </div>

    <script type="module">
      import JSZip from 'https://esm.sh/jszip@3.10.1';

      const fileInput = document.getElementById('file');
      const drop = document.getElementById('drop');
      const qualityInput = document.getElementById('quality');
      const qualityValue = document.getElementById('qv');
      const list = document.getElementById('list');
      const zipBtn = document.getElementById('zip');
      const clearBtn = document.getElementById('clear');
      const fallbackLink = document.getElementById('fallbackLink');

      const fallbackUrl = ${JSON.stringify(fallbackWebUrl ?? '')};
      if (fallbackUrl) {
        fallbackLink.href = fallbackUrl;
        fallbackLink.style.display = 'inline';
      }

      const items = [];

      const formatBytes = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const units = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 2) + ' ' + units[i];
      };

      const refreshButtons = () => {
        const done = items.filter((x) => x.status === 'done');
        zipBtn.disabled = done.length === 0;
        zipBtn.textContent = 'ZIP 다운로드 (' + done.length + ')';
        clearBtn.disabled = items.length === 0;
      };

      const render = () => {
        list.innerHTML = '';
        items.forEach((item) => {
          const wrap = document.createElement('div');
          wrap.className = 'item';
          wrap.innerHTML =
            '<div class=\"name\" title=\"' + item.name + '\">' + item.name + '</div>' +
            '<div class=\"meta\">원본: ' + formatBytes(item.originalSize) + '</div>' +
            '<div class=\"meta\" data-size></div>' +
            '<div class=\"meta\" data-status></div>' +
            '<div class=\"item-actions\" data-actions></div>';

          const sizeEl = wrap.querySelector('[data-size]');
          const statusEl = wrap.querySelector('[data-status]');
          const actions = wrap.querySelector('[data-actions]');

          if (item.status === 'done') {
            const reduction = Math.max(0, Math.round(((item.originalSize - item.webpSize) / item.originalSize) * 100));
            sizeEl.textContent = 'WebP: ' + formatBytes(item.webpSize);
            statusEl.innerHTML = '<span class="ok">완료 · ' + reduction + '% 절감</span>';
            const a = document.createElement('a');
            a.className = 'btn secondary';
            a.textContent = '다운로드';
            a.href = item.url;
            a.download = item.name.replace(/\.[^/.]+$/, '') + '.webp';
            actions.appendChild(a);
          } else if (item.status === 'error') {
            sizeEl.textContent = 'WebP: -';
            statusEl.innerHTML = '<span class="err">실패</span>';
          } else {
            sizeEl.textContent = 'WebP: 처리 중';
            statusEl.innerHTML = '<span class="status">변환 중...</span>';
          }

          const remove = document.createElement('button');
          remove.className = 'btn secondary';
          remove.textContent = '삭제';
          remove.onclick = () => {
            if (item.url) URL.revokeObjectURL(item.url);
            const idx = items.indexOf(item);
            if (idx >= 0) items.splice(idx, 1);
            render();
            refreshButtons();
          };
          actions.appendChild(remove);

          list.appendChild(wrap);
        });
      };

      const toWebP = (file, quality) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('no context'));
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
              if (!blob) return reject(new Error('blob failed'));
              resolve(blob);
            }, 'image/webp', quality);
          };
          img.onerror = () => reject(new Error('image load failed'));
          img.src = reader.result;
        };
        reader.onerror = () => reject(new Error('file read failed'));
        reader.readAsDataURL(file);
      });

      const processFiles = async (files) => {
        const q = Number(qualityInput.value);
        const valid = Array.from(files).filter((f) => f.type.startsWith('image/'));
        if (!valid.length) return;

        const newItems = valid.map((f) => ({
          name: f.name,
          originalSize: f.size,
          status: 'processing',
          webpSize: 0,
          blob: null,
          url: '',
        }));
        items.unshift(...newItems);
        render();
        refreshButtons();

        for (let i = 0; i < valid.length; i++) {
          const file = valid[i];
          const item = newItems[i];
          try {
            const blob = await toWebP(file, q);
            item.status = 'done';
            item.blob = blob;
            item.webpSize = blob.size;
            item.url = URL.createObjectURL(blob);
          } catch {
            item.status = 'error';
          }
          render();
          refreshButtons();
        }
      };

      drop.addEventListener('click', () => fileInput.click());
      drop.addEventListener('dragover', (e) => { e.preventDefault(); });
      drop.addEventListener('drop', (e) => {
        e.preventDefault();
        processFiles(e.dataTransfer.files);
      });
      fileInput.addEventListener('change', (e) => {
        processFiles(e.target.files);
        e.target.value = '';
      });

      qualityInput.addEventListener('input', () => {
        qualityValue.textContent = Math.round(Number(qualityInput.value) * 100) + '%';
      });

      zipBtn.addEventListener('click', async () => {
        const done = items.filter((x) => x.status === 'done' && x.blob);
        if (!done.length) return;
        const zip = new JSZip();
        done.forEach((x) => {
          zip.file(x.name.replace(/\.[^/.]+$/, '') + '.webp', x.blob);
        });
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'converted_images_' + Date.now() + '.zip';
        a.click();
        URL.revokeObjectURL(url);
      });

      clearBtn.addEventListener('click', () => {
        items.forEach((x) => { if (x.url) URL.revokeObjectURL(x.url); });
        items.length = 0;
        render();
        refreshButtons();
      });

      refreshButtons();
    </script>
  </body>
</html>
      `.trim(),
      _meta: {
        'openai/widgetDescription': '채팅 안에서 이미지를 WebP로 바로 변환하는 위젯',
        'openai/widgetPrefersBorder': true,
        'openai/widgetCSP': {
          connect_domains: [],
          resource_domains: ['https://esm.sh'],
        },
      },
    },
  ],
}));

server.registerTool(
  'open_webp_converter',
  {
    title: 'Open WebP Master',
    description: 'Open an in-chat WebP converter widget and convert images directly.',
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
      'openai/toolInvocation/invoking': '위젯 준비 중...',
      'openai/toolInvocation/invoked': 'WebP 위젯이 준비되었습니다.',
    },
  },
  async ({ quality }) => {
    const qualityText = quality ? `품질 ${Math.round(quality * 100)}%로` : '기본 품질로';
    const fallbackText = fallbackWebUrl ? `\n전체 웹 버전: ${fallbackWebUrl}` : '';

    return {
      content: [
        {
          type: 'text',
          text: `채팅 안 위젯에서 ${qualityText} 바로 변환하세요.${fallbackText}`,
        },
      ],
      structuredContent: {
        mode: 'in_chat_widget',
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
