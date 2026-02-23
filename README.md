# WebP Master -> ChatGPT App 등록용 워크스페이스

이 폴더는 아래 2개로 구성됩니다.

- `web-ui`: 실제 WebP 변환 UI (Vite + React)
- `mcp-server`: ChatGPT와 연결되는 MCP 서버

## 앱 포지셔닝

- App Name: `WebP Master for ChatGPT`
- One-liner: `ChatGPT에서 만든 이미지를 바로 WebP로 경량화해 게시 가능한 파일로 빠르게 바꿔주는 앱`
- 핵심 가치: 단순 변환이 아니라 `생성 -> 최적화 -> 게시` 워크플로우를 ChatGPT 안에서 연결

상세 제출 문구는 `APP_SUBMISSION_COPY.md`를 그대로 사용하면 됩니다.

## 1) 로컬 실행

### UI 실행
```bash
npm run ui:install
npm run ui:dev
```

### MCP 서버 실행
```bash
npm run mcp:install
cp mcp-server/.env.example mcp-server/.env
# mcp-server/.env에서 WEB_APP_URL 수정
npm run mcp:dev
```

## 2) 배포 순서

1. `web-ui`를 Vercel/Cloudflare Pages 등에 배포
2. 배포 URL을 `WEB_APP_URL`로 설정
3. `mcp-server`를 Render/Railway/Fly.io 등에 배포
4. 공개 MCP 엔드포인트 확인: `https://<your-mcp-domain>/mcp`
5. ChatGPT에서는 공개 URL만 연결 가능하므로 로컬호스트 URL은 사용 불가

## 3) ChatGPT Developer Mode 연결

1. ChatGPT에서 Developer/App 연결 화면으로 이동
2. MCP 서버 URL에 `https://<your-mcp-domain>/mcp` 입력
3. 도구 목록에서 `open_webp_converter` 확인
4. 채팅에서 도구 호출 시 ChatGPT 내 위젯 UI(iframe) 또는 링크 열기 확인

## 4) App Directory 제출 체크리스트

- 개인정보 처리/데이터 흐름 문서화 (이미지 서버 업로드 없음 명시)
- 앱 설명, 아이콘, 카테고리, 연락처 정보 준비
- 오류 상황(지원 포맷/용량 제한) 사용자 안내 문구 추가
- 계정 검증 완료 후 제출, 승인 후 Publish

## 참고

- OpenAI Apps SDK / MCP 관련 공식 문서를 기준으로 최종 제출 직전 항목을 다시 점검하세요.
