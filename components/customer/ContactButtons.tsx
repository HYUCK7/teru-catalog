import type { SiteSettings } from "@/lib/supabase/types";

export function ContactButtons({ settings }: { settings: SiteSettings }) {
  const items: { href: string; label: string }[] = [];

  if (settings.kakao_channel_url) {
    items.push({ href: settings.kakao_channel_url, label: "카톡 문의" });
  }
  if (settings.phone) {
    items.push({ href: `tel:${settings.phone}`, label: "전화" });
  }
  if (settings.instagram) {
    const href = settings.instagram.startsWith("http")
      ? settings.instagram
      : `https://instagram.com/${settings.instagram.replace(/^@/, "")}`;
    items.push({ href, label: "인스타" });
  }

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded bg-black py-3 text-center text-white"
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}
