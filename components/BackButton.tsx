"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const className =
  "inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800";

export function BackButton({ href, label }: { href?: string; label: string }) {
  const router = useRouter();

  const content = (
    <>
      <ChevronLeft className="h-4 w-4" />
      {label}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push("/menu");
      }}
      className={className}
    >
      {content}
    </button>
  );
}
