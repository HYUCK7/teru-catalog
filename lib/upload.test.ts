import { describe, expect, it } from "vitest";
import { validateImageFile } from "./upload";

describe("validateImageFile", () => {
  it("허용되지 않은 형식은 에러", () => {
    const result = validateImageFile({ type: "application/pdf", size: 100 });
    expect(result.ok).toBe(false);
  });

  it("용량 초과는 에러", () => {
    const result = validateImageFile({
      type: "image/png",
      size: 11 * 1024 * 1024,
    });
    expect(result.ok).toBe(false);
  });

  it("정상 파일은 ok", () => {
    const result = validateImageFile({ type: "image/jpeg", size: 1024 });
    expect(result.ok).toBe(true);
  });
});
