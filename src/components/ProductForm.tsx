import type { FormEvent } from "react";
import type { ProductDraft, ProductTone } from "../types/product";

export type ProductFormValues = {
  name: string;
  price: string;
  affiliateUrl: string;
  imageUrlsText: string;
  benefitsText: string;
  targetAudience: string;
  reviewNote: string;
  tone: ProductTone;
};

type Props = {
  values: ProductFormValues;
  onChange: (values: ProductFormValues) => void;
  onSubmit: (draft: ProductDraft) => void;
};

export const emptyFormValues: ProductFormValues = {
  name: "",
  price: "",
  affiliateUrl: "",
  imageUrlsText: "",
  benefitsText: "",
  targetAudience: "",
  reviewNote: "",
  tone: "friendly",
};

export function formValuesToDraft(values: ProductFormValues): ProductDraft {
  return {
    name: values.name.trim(),
    price: values.price.trim() || undefined,
    affiliateUrl: values.affiliateUrl.trim(),
    imageUrls: values.imageUrlsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    benefits: values.benefitsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    targetAudience: values.targetAudience.trim() || undefined,
    reviewNote: values.reviewNote.trim() || undefined,
    tone: values.tone,
    source: "manual",
  };
}

export function ProductForm({ values, onChange, onSubmit }: Props) {
  function update<K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K],
  ) {
    onChange({ ...values, [key]: value });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const draft = formValuesToDraft(values);
    if (!draft.name) return;
    onSubmit(draft);
  }

  return (
    <form className="panel form" onSubmit={handleSubmit}>
      <h2>2. 상품 정보</h2>

      <label>
        상품명 *
        <input
          required
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="예: 휴대용 미니 선풍기"
        />
      </label>

      <label>
        가격
        <input
          value={values.price}
          onChange={(e) => update("price", e.target.value)}
          placeholder="예: 19,900원"
        />
      </label>

      <label>
        상품/제휴 URL
        <input
          type="url"
          value={values.affiliateUrl}
          onChange={(e) => update("affiliateUrl", e.target.value)}
          placeholder="쇼핑 검색 링크 또는 쇼핑커넥트 수수료 링크"
        />
        <span className="field-hint">
          검색으로 채운 뒤, 쇼핑커넥트 수수료 링크로 바꿔 넣으면 됩니다.
        </span>
      </label>

      <label>
        이미지 URL (줄바꿈으로 여러 개)
        <textarea
          rows={3}
          value={values.imageUrlsText}
          onChange={(e) => update("imageUrlsText", e.target.value)}
          placeholder={"https://...\nhttps://..."}
        />
      </label>

      <label>
        특징 / 장점 (줄바꿈)
        <textarea
          rows={4}
          value={values.benefitsText}
          onChange={(e) => update("benefitsText", e.target.value)}
          placeholder={"가벼워요\n배터리가 오래가요\n소음이 적어요"}
        />
      </label>

      <label>
        이런 분께
        <input
          value={values.targetAudience}
          onChange={(e) => update("targetAudience", e.target.value)}
          placeholder="예: 출퇴근·캠핑용으로 가벼운 선풍기 찾는 분"
        />
      </label>

      <label>
        한 줄 후기
        <input
          value={values.reviewNote}
          onChange={(e) => update("reviewNote", e.target.value)}
          placeholder="예: 가방에 넣고 다니기 좋아요"
        />
      </label>

      <fieldset>
        <legend>톤</legend>
        {(
          [
            ["friendly", "친근"],
            ["review", "후기"],
            ["deal", "득템"],
          ] as const
        ).map(([value, label]) => (
          <label key={value} className="radio">
            <input
              type="radio"
              name="tone"
              checked={values.tone === value}
              onChange={() => update("tone", value)}
            />
            {label}
          </label>
        ))}
      </fieldset>

      <button type="submit" className="primary">
        블로그 초안 생성
      </button>
    </form>
  );
}
