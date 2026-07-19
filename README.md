# 돈버는 앱 (moneymaker)

채널별 콘텐츠로 수익을 만드는 웹앱입니다.

## 기능

- **네이버 브랜드커넥트**
  - 네이버 쇼핑 검색 API로 상품명·이미지·최저가·링크 자동 입력
  - 네이버 블로그 초안 생성·복사
- **인스타그램 / 유튜브**: 준비 중

## 로컬 실행

1. [네이버 개발자 센터](https://developers.naver.com/)에서 애플리케이션 등록 후 **검색** API 사용 설정
2. `.env.example`을 복사해 `.env` 작성

```bash
cp .env.example .env
# NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 입력
npm install
npm run dev
```

개발 서버의 `/api/shopping/search`가 네이버 API를 프록시합니다. (시크릿은 브라우저에 노출되지 않음)

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
