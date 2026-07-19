export type ChannelItem = {
  id: string;
  title: string;
  description: string;
  path: string;
  status: "ready" | "soon";
};

export const channels: ChannelItem[] = [
  {
    id: "naver-brand-connect",
    title: "네이버 브랜드커넥트",
    description: "상품 정보로 네이버 블로그 초안을 만들고 복사하세요.",
    path: "/naver-brand-connect",
    status: "ready",
  },
  {
    id: "instagram",
    title: "인스타그램",
    description: "쇼핑 콘텐츠용 캡션·해시태그 포맷 (준비 중).",
    path: "/instagram",
    status: "soon",
  },
  {
    id: "youtube",
    title: "유튜브",
    description: "숏폼·리뷰 스크립트 포맷 (준비 중).",
    path: "/youtube",
    status: "soon",
  },
];
