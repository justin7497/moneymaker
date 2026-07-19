import type { NaverBlogPost, ProductDraft, ProductTone } from "../types/product";

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(text: string): string {
  return escapeHtml(text).replaceAll("'", "&#39;");
}

function introForTone(tone: ProductTone, name: string): string {
  switch (tone) {
    case "review":
      return `직접 써보고 정리한 <b>${escapeHtml(name)}</b> 후기입니다.`;
    case "deal":
      return `지금 눈에 띄는 구성이라 정리해 둔 <b>${escapeHtml(name)}</b> 추천이에요.`;
    case "friendly":
    default:
      return `요즘 관심 있게 보고 있는 <b>${escapeHtml(name)}</b>를 가볍게 소개합니다.`;
  }
}

function titleForTone(tone: ProductTone, name: string, price?: string): string {
  const pricePart = price?.trim() ? ` | ${price.trim()}` : "";
  switch (tone) {
    case "review":
      return `${name} 솔직 후기${pricePart}`;
    case "deal":
      return `${name} 추천${pricePart}`;
    case "friendly":
    default:
      return `${name} 살펴봤어요${pricePart}`;
  }
}

function toneTags(tone: ProductTone): string[] {
  switch (tone) {
    case "review":
      return ["제품후기", "사용후기", "추천템"];
    case "deal":
      return ["득템", "추천상품", "쇼핑추천"];
    case "friendly":
    default:
      return ["일상추천", "쇼핑기록", "관심상품"];
  }
}

function extractNameTags(name: string): string[] {
  return name
    .split(/[\s,/|·\-_|]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2)
    .slice(0, 5);
}

function buildTags(draft: ProductDraft): string[] {
  const tags = [...extractNameTags(draft.name), ...toneTags(draft.tone)];
  return [...new Set(tags)].slice(0, 10);
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/h2>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li>/gi, "- ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function toNaverBlogFormat(draft: ProductDraft): NaverBlogPost {
  const name = draft.name.trim();
  const price = draft.price?.trim();
  const affiliateUrl = draft.affiliateUrl.trim();
  const targetAudience = draft.targetAudience?.trim();
  const reviewNote = draft.reviewNote?.trim();
  const benefits = draft.benefits.map((b) => b.trim()).filter(Boolean);
  const imageUrls = draft.imageUrls.map((u) => u.trim()).filter(Boolean);

  const title = titleForTone(draft.tone, name, price);
  const tags = buildTags(draft);

  const parts: string[] = [];

  if (draft.source === "brand_connect") {
    parts.push(
      "<p><b>이 포스팅은 네이버 쇼핑 커넥트 활동의 일환으로, 판매 발생 시 수수료를 제공받습니다.</b></p>",
    );
  }

  parts.push(`<p>${introForTone(draft.tone, name)}</p>`);

  if (reviewNote) {
    parts.push(`<p>${escapeHtml(reviewNote)}</p>`);
  }

  parts.push(`<h2>${escapeHtml(name)}</h2>`);
  if (price) {
    parts.push(`<p><b>가격:</b> ${escapeHtml(price)}</p>`);
  }

  for (const url of imageUrls) {
    parts.push(
      `<p><img src="${escapeAttr(url)}" alt="${escapeAttr(name)}" /></p>`,
    );
  }

  if (benefits.length > 0) {
    parts.push("<h2>이런 점이 좋아요</h2>");
    parts.push("<ul>");
    for (const benefit of benefits) {
      parts.push(`<li>${escapeHtml(benefit)}</li>`);
    }
    parts.push("</ul>");
  }

  if (targetAudience) {
    parts.push("<h2>이런 분께 추천</h2>");
    parts.push(`<p>${escapeHtml(targetAudience)}</p>`);
  }

  parts.push("<h2>자세히 보기</h2>");
  if (affiliateUrl) {
    parts.push(
      `<p><a href="${escapeAttr(affiliateUrl)}">${escapeHtml(affiliateUrl)}</a></p>`,
    );
  } else {
    parts.push("<p>제휴 링크를 입력하면 여기에 표시됩니다.</p>");
  }

  if (tags.length > 0) {
    parts.push(`<p>${tags.map((t) => `#${escapeHtml(t)}`).join(" ")}</p>`);
  }

  const html = parts.join("\n");

  return {
    title,
    html,
    tags,
    plainText: stripHtml(html),
  };
}
