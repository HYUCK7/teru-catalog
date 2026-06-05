import { describe, expect, it } from "vitest";
import { getSettings } from "./settings";

describe("getSettings", () => {
  it("단일 설정 행을 반환한다", async () => {
    const client = {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: { id: 1, shop_name: "가게" },
                error: null,
              }),
          }),
        }),
      }),
    };

    const settings = await getSettings(client as never);

    expect(settings.shop_name).toBe("가게");
  });
});
