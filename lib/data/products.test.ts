import { describe, expect, it, vi } from "vitest";
import { makeClient } from "@/test/mock-supabase";
import {
  getVisibleProductsByCategory,
  updateProductImageSortOrders,
} from "./products";

describe("getVisibleProductsByCategory", () => {
  it("주어진 카테고리의 상품 목록을 반환한다", async () => {
    const client = makeClient({
      products: {
        data: [{ id: "p1", name: "셔츠", is_visible: true }],
        error: null,
      },
    });

    const rows = await getVisibleProductsByCategory(client as never, "c1");

    expect(rows).toHaveLength(1);
    expect(client.from).toHaveBeenCalledWith("products");
  });

  it("에러가 나면 throw 한다", async () => {
    const client = makeClient({
      products: { data: null, error: { message: "boom" } },
    });

    await expect(
      getVisibleProductsByCategory(client as never, "c1"),
    ).rejects.toThrow("boom");
  });
});

describe("updateProductImageSortOrders", () => {
  it("각 이미지의 sort_order를 update 한다", async () => {
    const eq = vi.fn(() => Promise.resolve({ error: null }));
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ update }));

    await updateProductImageSortOrders({ from } as never, [
      { id: "img1", sortOrder: 0 },
      { id: "img2", sortOrder: 1 },
    ]);

    expect(from).toHaveBeenCalledWith("product_images");
    expect(update).toHaveBeenCalledWith({ sort_order: 0 });
    expect(update).toHaveBeenCalledWith({ sort_order: 1 });
    expect(eq).toHaveBeenCalledWith("id", "img1");
    expect(eq).toHaveBeenCalledWith("id", "img2");
  });

  it("에러가 나면 throw 한다", async () => {
    const eq = vi.fn(() => Promise.resolve({ error: { message: "boom" } }));
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ update }));

    await expect(
      updateProductImageSortOrders({ from } as never, [
        { id: "img1", sortOrder: 0 },
      ]),
    ).rejects.toThrow("boom");
  });
});
