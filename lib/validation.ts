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

export function validateCategoryInput(input: {
  name: string;
}): ValidationResult {
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

export function validateOrderInput(input: {
  customerName: string;
  phone: string;
  quantity: number;
  pickupDate: string;
  pickupTime: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.customerName.trim()) {
    errors.customerName = "주문자 이름을 입력하세요.";
  }
  if (!input.phone.trim()) errors.phone = "연락처를 입력하세요.";
  if (
    !Number.isFinite(input.quantity) ||
    !Number.isInteger(input.quantity) ||
    input.quantity < 1
  ) {
    errors.quantity = "수량은 1개 이상이어야 합니다.";
  }
  if (!input.pickupDate.trim()) {
    errors.pickupDate = "픽업 날짜를 선택하세요.";
  }
  if (!input.pickupTime.trim()) {
    errors.pickupTime = "픽업 시간을 선택하세요.";
  }

  return Object.keys(errors).length ? fail(errors) : ok();
}
