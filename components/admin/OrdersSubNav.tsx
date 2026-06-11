"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/orders", label: "주문 목록" },
  { href: "/admin/orders/availability", label: "예약 설정" },
];

export function OrdersSubNav() {
  const pathname = usePathname();

  return (
    <div className="flex gap-2 border-b px-4 pt-2">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-t-md px-3 py-2 text-sm font-medium",
              active
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-800",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
