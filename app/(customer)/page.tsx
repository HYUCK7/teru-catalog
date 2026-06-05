import Link from "next/link";
import { getSettings } from "@/lib/data/settings";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const settings = await getSettings(supabase);

  return (
    <main className="mx-auto max-w-md p-4 text-center">
      {settings.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={settings.logo_url}
          alt={settings.shop_name}
          className="mx-auto my-4 h-16 object-contain"
        />
      ) : (
        <h1 className="my-4 text-2xl font-bold">
          {settings.shop_name || "쇼핑몰"}
        </h1>
      )}
      {settings.banner_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={settings.banner_url}
          alt=""
          className="my-4 w-full rounded object-cover"
        />
      )}
      {settings.intro && <p className="my-4 text-gray-600">{settings.intro}</p>}
      <Link
        href="/menu"
        className="mt-6 block rounded bg-black py-4 text-lg font-medium text-white"
      >
        메뉴 보기
      </Link>
      <Link
        href="/admin/login"
        className="mt-3 block rounded border border-gray-300 py-3 text-sm font-medium text-gray-700"
      >
        관리자 로그인
      </Link>
    </main>
  );
}
