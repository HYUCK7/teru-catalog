import { describe, expect, it, vi } from "vitest";
import { makeClient } from "@/test/mock-supabase";
import { createOrder, getOrders, setOrderStatus } from "./orders";

function insertClient(error: { message: string } | null = null) {
  const insert = vi.fn(() => Promise.resolve({ error }));
  const from = vi.fn(() => ({ insert }));
  return { client: { from }, insert };
}

function updateClient(error: { message: string } | null = null) {
  const eq = vi.fn(() => Promise.resolve({ error }));
  const update = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ update }));
  return { client: { from }, update, eq };
}

const input = {
  productId: "p1",
  productName: "딸기 케이크",
  quantity: 2,
  customerName: "홍길동",
  phone: "010-1234-5678",
  pickupDate: "2026-06-20",
  pickupTime: "14:00",
  lettering: "생일축하해",
  requestMemo: "초 5개",
  selectedChoices: [{ label: "딸기", price: 3000, kind: "flavor" as const }],
  designImageUrl: "https://example.com/design.jpg",
};

describe("createOrder", () => {
  it("orders 테이블에 insert 한다", async () => {
    const { client, insert } = insertClient();
    await createOrder(client as never, input);
    expect(insert).toHaveBeenCalledWith({
      product_id: "p1",
      product_name: "딸기 케이크",
      quantity: 2,
      customer_name: "홍길동",
      phone: "010-1234-5678",
      pickup_date: "2026-06-20",
      pickup_time: "14:00",
      lettering: "생일축하해",
      request_memo: "초 5개",
      selected_choices: [{ label: "딸기", price: 3000, kind: "flavor" }],
      design_image_url: "https://example.com/design.jpg",
    });
  });

  it("에러 시 throw", async () => {
    const { client } = insertClient({ message: "fail" });
    await expect(createOrder(client as never, input)).rejects.toThrow("fail");
  });
});

describe("getOrders", () => {
  it("주문 목록을 반환한다", async () => {
    const client = makeClient({
      orders: {
        data: [{ id: "o1", product_name: "딸기 케이크" }],
        error: null,
      },
    });
    const rows = await getOrders(client as never);
    expect(rows).toHaveLength(1);
    expect(client.from).toHaveBeenCalledWith("orders");
  });

  it("에러 시 throw", async () => {
    const client = makeClient({
      orders: { data: null, error: { message: "boom" } },
    });
    await expect(getOrders(client as never)).rejects.toThrow("boom");
  });
});

describe("setOrderStatus", () => {
  it("status 를 update 한다", async () => {
    const { client, update, eq } = updateClient();
    await setOrderStatus(client as never, "o1", "pickup_waiting");
    expect(update).toHaveBeenCalledWith({ status: "pickup_waiting" });
    expect(eq).toHaveBeenCalledWith("id", "o1");
  });

  it("에러 시 throw", async () => {
    const { client } = updateClient({ message: "nope" });
    await expect(
      setOrderStatus(client as never, "o1", "picked_up"),
    ).rejects.toThrow("nope");
  });
});
