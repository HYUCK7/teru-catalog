import { describe, expect, it, vi } from "vitest";
import { createProduct } from "./products";

function insertClient(returnRow: unknown, error: { message: string } | null = null) {
  const single = vi.fn(() => Promise.resolve({ data: returnRow, error }));
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select }));
  const from = vi.fn(() => ({ insert }));

  return { client: { from }, insert };
}

describe("createProduct", () => {
  it("products 테이블에 insert 하고 생성된 행을 반환한다", async () => {
    const { client, insert } = insertClient({ id: "p1", name: "셔츠" });

    const row = await createProduct(client as never, {
      name: "셔츠",
      price: 1000,
      categoryId: "c1",
      description: "설명",
      isVisible: true,
    });

    expect(insert).toHaveBeenCalled();
    expect(row.id).toBe("p1");
  });

  it("에러 시 throw", async () => {
    const { client } = insertClient(null, { message: "fail" });

    await expect(
      createProduct(client as never, {
        name: "셔츠",
        price: 1000,
        categoryId: "c1",
        description: "",
        isVisible: true,
      }),
    ).rejects.toThrow("fail");
  });
});
