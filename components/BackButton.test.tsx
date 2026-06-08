import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BackButton } from "./BackButton";

const { back, push } = vi.hoisted(() => ({
  back: vi.fn(),
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back, push }),
}));

function setHistoryLength(length: number) {
  Object.defineProperty(window.history, "length", {
    configurable: true,
    value: length,
  });
}

afterEach(() => {
  back.mockClear();
  push.mockClear();
});

describe("BackButton", () => {
  it("renders a link to href with the label when href is given", () => {
    render(<BackButton href="/" label="메인" />);

    const link = screen.getByRole("link", { name: "메인" });
    expect(link).toHaveAttribute("href", "/");
  });

  it("calls router.back() on click when no href and history exists", () => {
    setHistoryLength(2);
    render(<BackButton label="뒤로" />);

    fireEvent.click(screen.getByRole("button", { name: "뒤로" }));

    expect(back).toHaveBeenCalledTimes(1);
    expect(push).not.toHaveBeenCalled();
  });

  it("falls back to /menu on click when no href and no history", () => {
    setHistoryLength(1);
    render(<BackButton label="뒤로" />);

    fireEvent.click(screen.getByRole("button", { name: "뒤로" }));

    expect(push).toHaveBeenCalledWith("/menu");
    expect(back).not.toHaveBeenCalled();
  });
});
