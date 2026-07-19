export type NaverShoppingProduct = {
  title: string;
  link: string;
  image: string;
  lprice: string;
  hprice?: string;
  mallName?: string;
  brand?: string;
  maker?: string;
  productId?: string;
  category1?: string;
  category2?: string;
  category3?: string;
  category4?: string;
};

export type ShoppingSearchResponse = {
  ok: true;
  query: string;
  items: NaverShoppingProduct[];
};

export type ShoppingSearchError = {
  ok: false;
  error: string;
  message?: string;
};

type NaverShopItemRaw = {
  title?: string;
  link?: string;
  image?: string;
  lprice?: string;
  hprice?: string;
  mallName?: string;
  brand?: string;
  maker?: string;
  productId?: string;
  category1?: string;
  category2?: string;
  category3?: string;
  category4?: string;
};

export function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").trim();
}

export function formatWon(lprice: string): string {
  const n = Number(lprice);
  if (!Number.isFinite(n) || n <= 0) return "";
  return `${n.toLocaleString("ko-KR")}원`;
}

export function mapNaverShopItems(items: NaverShopItemRaw[]): NaverShoppingProduct[] {
  const mapped: NaverShoppingProduct[] = [];
  for (const item of items) {
    const title = stripHtml(item.title ?? "");
    if (!title) continue;
    mapped.push({
      title,
      link: (item.link ?? "").trim(),
      image: (item.image ?? "").trim(),
      lprice: (item.lprice ?? "").trim(),
      hprice: item.hprice?.trim() || undefined,
      mallName: item.mallName?.trim() || undefined,
      brand: item.brand?.trim() || undefined,
      maker: item.maker?.trim() || undefined,
      productId: item.productId?.trim() || undefined,
      category1: item.category1?.trim() || undefined,
      category2: item.category2?.trim() || undefined,
      category3: item.category3?.trim() || undefined,
      category4: item.category4?.trim() || undefined,
    });
  }
  return mapped;
}

export async function fetchNaverShoppingSearch(options: {
  query: string;
  clientId: string;
  clientSecret: string;
  display?: number;
  sort?: "sim" | "date" | "asc" | "dsc";
}): Promise<NaverShoppingProduct[]> {
  const query = options.query.trim();
  if (!query) return [];

  const url = new URL("https://openapi.naver.com/v1/search/shop.json");
  url.searchParams.set("query", query);
  url.searchParams.set("display", String(options.display ?? 10));
  url.searchParams.set("sort", options.sort ?? "sim");

  const res = await fetch(url.toString(), {
    headers: {
      "X-Naver-Client-Id": options.clientId,
      "X-Naver-Client-Secret": options.clientSecret,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`naver_api_${res.status}${body ? `: ${body.slice(0, 200)}` : ""}`);
  }

  const data = (await res.json()) as { items?: NaverShopItemRaw[] };
  return mapNaverShopItems(data.items ?? []);
}
