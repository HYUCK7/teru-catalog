import { describe, expect, it } from "vitest";
import {
  validateCategoryInput,
  validateOrderInput,
  validateProductInput,
  validateSettingsInput,
} from "./validation";

describe("validateProductInput", () => {
  it("상품명이 비면 에러", () => {
    const result = validateProductInput({
      name: "",
      price: 1000,
      categoryId: "c1",
    });

    expect(result.ok).toBe(false);
    expect(result.errors.name).toBeDefined();
  });

  it("가격이 음수면 에러", () => {
    const result = validateProductInput({
      name: "셔츠",
      price: -1,
      categoryId: "c1",
    });

    expect(result.ok).toBe(false);
    expect(result.errors.price).toBeDefined();
  });

  it("가격이 DB integer 범위를 넘으면 에러", () => {
    const result = validateProductInput({
      name: "셔츠",
      price: 999999999999,
      categoryId: "c1",
    });

    expect(result.ok).toBe(false);
    expect(result.errors.price).toBeDefined();
  });

  it("가격이 소수면 에러", () => {
    const result = validateProductInput({
      name: "셔츠",
      price: 1000.5,
      categoryId: "c1",
    });

    expect(result.ok).toBe(false);
    expect(result.errors.price).toBeDefined();
  });

  it("카테고리가 없으면 에러", () => {
    const result = validateProductInput({
      name: "셔츠",
      price: 1000,
      categoryId: "",
    });

    expect(result.ok).toBe(false);
    expect(result.errors.categoryId).toBeDefined();
  });

  it("정상 입력은 ok", () => {
    const result = validateProductInput({
      name: "셔츠",
      price: 1000,
      categoryId: "c1",
    });

    expect(result.ok).toBe(true);
  });
});

describe("validateCategoryInput", () => {
  it("이름이 비면 에러", () => {
    expect(validateCategoryInput({ name: "  " }).ok).toBe(false);
  });

  it("정상 이름은 ok", () => {
    expect(validateCategoryInput({ name: "상의" }).ok).toBe(true);
  });
});

describe("validateSettingsInput", () => {
  it("가게명이 비면 에러", () => {
    expect(validateSettingsInput({ shop_name: "" }).ok).toBe(false);
  });

  it("정상 가게명은 ok", () => {
    expect(validateSettingsInput({ shop_name: "우리가게" }).ok).toBe(true);
  });
});

describe("validateOrderInput", () => {
  const valid = {
    customerName: "홍길동",
    phone: "010-1234-5678",
    quantity: 1,
    pickupDate: "2026-06-20",
    pickupTime: "14:00",
  };

  it("정상 입력이면 ok", () => {
    expect(validateOrderInput(valid).ok).toBe(true);
  });

  it("이름이 비면 에러", () => {
    const result = validateOrderInput({ ...valid, customerName: "  " });
    expect(result.ok).toBe(false);
    expect(result.errors.customerName).toBeTruthy();
  });

  it("연락처가 비면 에러", () => {
    const result = validateOrderInput({ ...valid, phone: "" });
    expect(result.errors.phone).toBeTruthy();
  });

  it("수량이 0 이하 또는 소수면 에러", () => {
    expect(
      validateOrderInput({ ...valid, quantity: 0 }).errors.quantity,
    ).toBeTruthy();
    expect(
      validateOrderInput({ ...valid, quantity: -1 }).errors.quantity,
    ).toBeTruthy();
    expect(
      validateOrderInput({ ...valid, quantity: 1.5 }).errors.quantity,
    ).toBeTruthy();
  });

  it("픽업 날짜/시간이 비면 에러", () => {
    expect(
      validateOrderInput({ ...valid, pickupDate: "" }).errors.pickupDate,
    ).toBeTruthy();
    expect(
      validateOrderInput({ ...valid, pickupTime: "" }).errors.pickupTime,
    ).toBeTruthy();
  });
});
