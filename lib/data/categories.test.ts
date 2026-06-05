import { describe, expect, it } from "vitest";
import { makeClient } from "@/test/mock-supabase";
import { getCategories } from "./categories";

describe("getCategories", () => {
  it("sort_order 순으로 카테고리를 반환한다", async () => {
    const client = makeClient({
      categories: {
        data: [{ id: "c1", name: "상의", sort_order: 0 }],
        error: null,
      },
    });

    const rows = await getCategories(client as never);

    expect(rows[0].name).toBe("상의");
  });

  it("에러 시 throw", async () => {
    const client = makeClient({
      categories: { data: null, error: { message: "x" } },
    });

    await expect(getCategories(client as never)).rejects.toThrow("x");
  });
});
