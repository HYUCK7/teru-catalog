export type ValidationResult = { ok: boolean; errors: Record<string, string> };

export const MAX_INT_PRICE = 2147483647;

const ok = (): ValidationResult => ({ ok: true, errors: {} });

const fail = (errors: Record<string, string>): ValidationResult => ({
  ok: false,
  errors,
});

export function validateProductInput(input: {
  name: string;
  price: number;
  categoryId: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.name.trim()) errors.name = "상품명을 입력하세요.";
  if (
    !Number.isFinite(input.price) ||
    !Number.isInteger(input.price) ||
    input.price < 0 ||
    input.price > MAX_INT_PRICE
  ) {
    errors.price = `가격은 0 이상 ${MAX_INT_PRICE.toLocaleString()} 이하의 정수여야 합니다.`;
  }
  if (!input.categoryId) errors.categoryId = "카테고리를 선택하세요.";

  return Object.keys(errors).length ? fail(errors) : ok();
}

export function validateCategoryInput(input: { name: string }): ValidationResult {
  return input.name.trim()
    ? ok()
    : fail({ name: "카테고리 이름을 입력하세요." });
}

export function validateSettingsInput(input: {
  shop_name: string;
}): ValidationResult {
  return input.shop_name.trim()
    ? ok()
    : fail({ shop_name: "가게명을 입력하세요." });
}
