import type { SiteSettings } from "@/lib/supabase/types";
import { DEFAULT_CONTACT_LABELS } from "./contact-labels";

export function ContactButtons({ settings }: { settings: SiteSettings }) {
  const items: { key: string; href: string; label: string }[] = [];

  if (settings.kakao_channel_url) {
    items.push({
      key: "kakao",
      href: settings.kakao_channel_url,
      label: settings.kakao_label ?? DEFAULT_CONTACT_LABELS.kakao,
    });
  }
  if (settings.phone) {
    items.push({
      key: "phone",
      href: `tel:${settings.phone}`,
      label: settings.phone_label ?? DEFAULT_CONTACT_LABELS.phone,
    });
  }
  if (settings.instagram) {
    const href = settings.instagram.startsWith("http")
      ? settings.instagram
      : `https://instagram.com/${settings.instagram.replace(/^@/, "")}`;
    items.push({
      key: "instagram",
      href,
      label: settings.instagram_label ?? DEFAULT_CONTACT_LABELS.instagram,
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <a
          key={item.key}
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
