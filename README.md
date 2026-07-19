# 돈버는 앱 (moneymaker)

채널별 콘텐츠로 수익을 만드는 웹앱입니다.

## 기능

- **네이버 브랜드커넥트**
  - 쇼핑커넥트 상품 URL 붙여넣기 → 상품명·가격·이미지·수수료·제휴링크 수집
  - 네이버 블로그 초안 생성·복사 (수수료 고지 문구 포함)
  - 보조: 네이버 쇼핑 검색 API
- **인스타그램 / 유튜브**: 준비 중

## 로컬 실행

1. `.env.example`을 복사해 `.env` 작성
2. 브랜드커넥트에 로그인한 뒤 브라우저 Cookie를 `BRANDCONNECT_COOKIE`에 넣기
3. (선택) 쇼핑 검색용 `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET`

```bash
cp .env.example .env
npm install
npm run dev
```

상품 URL 예:
- 목록: `https://brandconnect.naver.com/{spaceId}/affiliate/products`
- 상세: `https://brandconnect.naver.com/{spaceId}/affiliate/products/{productId}`

개발 서버 API:
- `/api/brandconnect/products?url=...&q=검색어` (목록 검색)
- `/api/brandconnect/product?url=...` (상세 1건)
- `/api/shopping/search?q=...`

## 프로덕션 API (Cloudflare Worker)

GitHub Pages는 정적 호스팅이라 쇼핑 API는 Worker로 띄웁니다.

```bash
npx wrangler secret put NAVER_CLIENT_ID
npx wrangler secret put NAVER_CLIENT_SECRET
npx wrangler deploy
```

배포된 Worker URL을 GitHub Actions secret `VITE_API_BASE`에 넣고 다시 빌드하면 Pages에서 검색이 동작합니다.

## 배포

GitHub Pages: https://justin7497.github.io/moneymaker/

`main` 브랜치 push 시 Actions가 자동 배포합니다.
