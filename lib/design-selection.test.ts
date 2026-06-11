import { describe, expect, it } from "vitest";
import {
  isDesignSelectionRequired,
  validateDesignSelection,
} from "./design-selection";

describe("isDesignSelectionRequired", () => {
  it("카테고리 토글이 켜지고 이미지가 2장 이상이면 true", () => {
    expect(isDesignSelectionRequired(true, 2)).toBe(true);
    expect(isDesignSelectionRequired(true, 3)).toBe(true);
  });

  it("토글이 꺼져 있거나 이미지가 2장 미만이면 false", () => {
    expect(isDesignSelectionRequired(false, 2)).toBe(false);
    expect(isDesignSelectionRequired(true, 1)).toBe(false);
    expect(isDesignSelectionRequired(true, 0)).toBe(false);
  });
});

describe("validateDesignSelection", () => {
  const imageUrls = ["https://example.com/a.jpg", "https://example.com/b.jpg"];

  it("선택한 이미지 URL을 반환한다", () => {
    expect(validateDesignSelection(imageUrls[1], imageUrls)).toEqual({
      ok: true,
      url: imageUrls[1],
    });
  });

  it("미선택은 에러", () => {
    expect(validateDesignSelection("", imageUrls)).toEqual({
      ok: false,
      error: "디자인을 선택해주세요.",
    });
  });

  it("상품 이미지가 아닌 URL은 에러", () => {
    expect(
      validateDesignSelection("https://example.com/x.jpg", imageUrls),
    ).toEqual({
      ok: false,
      error: "선택할 수 없는 디자인이에요.",
    });
  });
});
