import { describe, expect, it } from "vitest";
import type { CategoryChoice } from "@/lib/supabase/types";
import {
  isChoiceKind,
  sumChoicePrice,
  validateChoiceSelection,
} from "./customization";

const flavors: CategoryChoice[] = [
  {
    id: "a",
    category_id: "c",
    kind: "flavor",
    label: "딸기",
    price: 3000,
    sort_order: 0,
    created_at: "",
  },
  {
    id: "b",
    category_id: "c",
    kind: "flavor",
    label: "블루베리",
    price: 0,
    sort_order: 1,
    created_at: "",
  },
];

describe("isChoiceKind", () => {
  it("유효한 값만 true", () => {
    expect(isChoiceKind("flavor")).toBe(true);
    expect(isChoiceKind("option")).toBe(true);
    expect(isChoiceKind("xxx")).toBe(false);
    expect(isChoiceKind("")).toBe(false);
  });
});

describe("validateChoiceSelection", () => {
  it("선택 없음은 허용한다", () => {
    const result = validateChoiceSelection([], flavors);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.snapshot).toEqual([]);
  });

  it("여러 개 선택 가능하고 서버 데이터로 스냅샷을 만든다", () => {
    const result = validateChoiceSelection(["딸기", "블루베리"], flavors);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.snapshot).toEqual([
        { label: "딸기", price: 3000, kind: "flavor" },
        { label: "블루베리", price: 0, kind: "flavor" },
      ]);
    }
  });

  it("정식 항목에 없는 라벨은 에러", () => {
    const result = validateChoiceSelection(["없는맛"], flavors);
    expect(result.ok).toBe(false);
  });

  it("중복 라벨은 한 번만 저장한다", () => {
    const result = validateChoiceSelection(["딸기", "딸기"], flavors);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.snapshot).toEqual([
        { label: "딸기", price: 3000, kind: "flavor" },
      ]);
    }
  });

  it("빈 라벨은 무시한다", () => {
    const result = validateChoiceSelection(["", "  ", "딸기"], flavors);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.snapshot).toEqual([
        { label: "딸기", price: 3000, kind: "flavor" },
      ]);
    }
  });
});

describe("sumChoicePrice", () => {
  it("스냅샷 가격 합계를 반환한다", () => {
    expect(
      sumChoicePrice([
        { label: "딸기", price: 3000, kind: "flavor" },
        { label: "2호", price: 5000, kind: "option" },
      ]),
    ).toBe(8000);
    expect(sumChoicePrice([])).toBe(0);
  });
});
