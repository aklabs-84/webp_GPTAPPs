# ChatGPT 앱 등록 가이드 (WebP Master)

기준일: 2026-02-23

## 0) 지금 만들어진 구성
- UI 프로젝트: `web-ui`
- ChatGPT 연결 서버(MCP): `mcp-server`
- MCP Tool 이름: `open_webp_converter`

## 1) UI 먼저 배포
1. `web-ui`를 배포합니다.
2. 배포 후 URL을 확보합니다. 예: `https://webp-master.yourdomain.com`

권장: Vercel
- Framework: Vite
- Build: `npm run build`
- Output: `dist`

## 2) MCP 서버 배포
1. 환경변수 설정
- `WEB_APP_URL=https://webp-master.yourdomain.com`
- `PORT=8787` (플랫폼 기본 포트 규칙에 맞춰 조정 가능)

2. 서버 실행 커맨드
- Build: `npm run mcp:build`
- Start: `npm run mcp:start`

3. 엔드포인트 확인
- `https://<your-mcp-domain>/mcp`

## 3) ChatGPT에 연결(개발 단계)
1. ChatGPT Developer/App 연결 화면에서 MCP URL 등록
2. 도구 목록에서 `open_webp_converter` 노출 확인
3. 채팅에서 "WebP 변환기 열어줘" 요청
4. 위젯(임베드) 또는 링크로 UI가 열리는지 확인하고 실제 변환/다운로드 동작 점검
5. 주의: `localhost`/사설망 URL은 연결되지 않으므로 반드시 공개 배포 URL 사용

## 4) 제출 전 검수 체크리스트
- 앱 설명(한국어/영어) 준비
- 아이콘(512x512) 준비
- 개인정보/데이터 처리 명시
- 장애 대응 문구 준비
- 연락처/지원 URL 준비

## 5) App Directory 제출
1. OpenAI Platform의 앱 제출 화면으로 이동
2. 메타데이터/설명/카테고리/정책 URL 입력
3. 리뷰 제출
4. 승인 후 Publish 버튼으로 공개

## 6) 심사 통과 확률 올리는 포인트
- "이미지는 서버 업로드 없이 브라우저 내 변환"을 명확히 기재
- 허용 포맷(JPG/PNG), 한계(브라우저 메모리) 사전 안내
- 오류 시 사용자 안내(파일 수/용량 줄이기) 추가
