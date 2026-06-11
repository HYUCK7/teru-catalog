import { describe, expect, it, vi } from "vitest";
import { makeClient } from "@/test/mock-supabase";
import { getCategories, getCategoryById, updateCategory } from "./categories";

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

describe("getCategoryById", () => {
  it("카테고리 단건을 반환한다", async () => {
    const client = makeClient({
      categories: {
        data: { id: "c1", name: "케이크", design_enabled: true },
        error: null,
      },
    });

    const row = await getCategoryById(client as never, "c1");

    expect(row?.design_enabled).toBe(true);
  });

  it("없으면 null", async () => {
    const client = makeClient({
      categories: {
        data: null,
        error: { message: "missing", code: "PGRST116" },
      },
    });

    await expect(getCategoryById(client as never, "x")).resolves.toBeNull();
  });
});

describe("updateCategory", () => {
  it("design_enabled 를 update 한다", async () => {
    const eq = vi.fn(() => Promise.resolve({ error: null }));
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ update }));

    await updateCategory({ from } as never, "c1", { design_enabled: true });

    expect(update).toHaveBeenCalledWith({ design_enabled: true });
    expect(eq).toHaveBeenCalledWith("id", "c1");
  });
});
