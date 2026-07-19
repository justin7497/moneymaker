export type ProductTone = "friendly" | "review" | "deal";

export type ProductSource = "manual" | "brand_connect" | "naver_shopping";

export type ProductDraft = {
  name: string;
  price?: string;
  affiliateUrl: string;
  imageUrls: string[];
  benefits: string[];
  targetAudience?: string;
  reviewNote?: string;
  tone: ProductTone;
  /** Reserved for future Brand Connect ingestion */
  source?: ProductSource;
};

export type NaverBlogPost = {
  title: string;
  html: string;
  tags: string[];
  plainText: string;
};
