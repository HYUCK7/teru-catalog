import { describe, expect, it } from "vitest";
import {
  validateCategoryInput,
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
