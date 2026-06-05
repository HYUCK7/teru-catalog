import { AdminNav } from "@/components/admin/AdminNav";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getSettings } from "@/lib/data/settings";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const settings = await getSettings(supabase);

  return (
    <div>
      <AdminNav />
      <h1 className="p-4 text-xl font-bold">사이트 설정</h1>
      <SettingsForm initial={settings} />
    </div>
  );
}
