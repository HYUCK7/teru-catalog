import { describe, expect, it, vi } from "vitest";
import { makeClient } from "@/test/mock-supabase";
import {
  addCategoryChoice,
  getChoicesByCategory,
  getChoicesForCategories,
  getNextChoiceSortOrder,
  removeCategoryChoice,
  updateCategoryChoice,
} from "./category-choices";

describe("getChoicesByCategory", () => {
  it("카테고리 항목을 반환한다", async () => {
    const client = makeClient({
      category_choices: {
        data: [{ id: "cc1", category_id: "c1", kind: "flavor" }],
        error: null,
      },
    });

    const rows = await getChoicesByCategory(client as never, "c1");

    expect(rows).toHaveLength(1);
    expect(client.from).toHaveBeenCalledWith("category_choices");
  });

  it("에러 시 throw", async () => {
    const client = makeClient({
      category_choices: { data: null, error: { message: "boom" } },
    });

    await expect(getChoicesByCategory(client as never, "c1")).rejects.toThrow(
      "boom",
    );
  });
});

describe("getChoicesForCategories", () => {
  it("카테고리별로 항목을 묶어 반환한다", async () => {
    const client = makeClient({
      category_choices: {
        data: [
          { id: "cc1", category_id: "c1", kind: "flavor" },
          { id: "cc2", category_id: "c2", kind: "option" },
        ],
        error: null,
      },
    });

    const rows = await getChoicesForCategories(client as never, ["c1", "c2"]);

    expect(rows.c1).toHaveLength(1);
    expect(rows.c2).toHaveLength(1);
  });

  it("카테고리 id가 없으면 빈 객체를 반환한다", async () => {
    const client = makeClient({});

    const rows = await getChoicesForCategories(client as never, []);

    expect(rows).toEqual({});
    expect(client.from).not.toHaveBeenCalled();
  });
});

describe("getNextChoiceSortOrder", () => {
  it("마지막 sort_order 다음 값을 반환한다", async () => {
    const client = makeClient({
      category_choices: {
        data: [{ sort_order: 3 }],
        error: null,
      },
    });

    await expect(
      getNextChoiceSortOrder(client as never, "c1", "flavor"),
    ).resolves.toBe(4);
  });

  it("기존 항목이 없으면 0", async () => {
    const client = makeClient({
      category_choices: {
        data: [],
        error: null,
      },
    });

    await expect(
      getNextChoiceSortOrder(client as never, "c1", "option"),
    ).resolves.toBe(0);
  });
});

function writeClient(error: { message: string } | null = null) {
  const insert = vi.fn(() => Promise.resolve({ error }));
  const updateEq = vi.fn(() => Promise.resolve({ error }));
  const update = vi.fn(() => ({ eq: updateEq }));
  const deleteEq = vi.fn(() => Promise.resolve({ error }));
  const deleteFn = vi.fn(() => ({ eq: deleteEq }));
  const from = vi.fn(() => ({ insert, update, delete: deleteFn }));

  return { client: { from }, insert, update, updateEq, deleteFn, deleteEq };
}

describe("category choice writes", () => {
  it("항목을 추가한다", async () => {
    const { client, insert } = writeClient();

    await addCategoryChoice(client as never, {
      categoryId: "c1",
      kind: "flavor",
      label: "딸기",
      price: 3000,
      sortOrder: 0,
    });

    expect(insert).toHaveBeenCalledWith({
      category_id: "c1",
      kind: "flavor",
      label: "딸기",
      price: 3000,
      sort_order: 0,
    });
  });

  it("항목을 수정한다", async () => {
    const { client, update, updateEq } = writeClient();

    await updateCategoryChoice(client as never, "cc1", {
      label: "바닐라",
      price: 1000,
    });

    expect(update).toHaveBeenCalledWith({ label: "바닐라", price: 1000 });
    expect(updateEq).toHaveBeenCalledWith("id", "cc1");
  });

  it("항목을 삭제한다", async () => {
    const { client, deleteFn, deleteEq } = writeClient();

    await removeCategoryChoice(client as never, "cc1");

    expect(deleteFn).toHaveBeenCalled();
    expect(deleteEq).toHaveBeenCalledWith("id", "cc1");
  });
});
