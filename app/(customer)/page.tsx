import { getSettings } from "@/lib/data/settings";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

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
        m e n u !
      </Link>
      <Link
        href="/admin/login"
         className="mt-3 block py-3 text-sm font-medium text-gray-700 opacity-30"
      >
        L O G I N
      </Link>
    </main>
  );
}
