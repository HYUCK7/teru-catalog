import { describe, expect, it } from "vitest";
import { makeClient } from "@/test/mock-supabase";
import { getVisibleProductsByCategory } from "./products";

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
