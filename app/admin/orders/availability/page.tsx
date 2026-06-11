import { AdminNav } from "@/components/admin/AdminNav";
import { AvailabilitySettings } from "@/components/admin/AvailabilitySettings";
import { OrdersSubNav } from "@/components/admin/OrdersSubNav";
import { getBlockedTimes, getClosedDates } from "@/lib/data/availability";
import { getSettings } from "@/lib/data/settings";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminAvailabilityPage() {
  const supabase = await createClient();
  const [settings, closedDates, blockedTimes] = await Promise.all([
    getSettings(supabase),
    getClosedDates(supabase),
    getBlockedTimes(supabase),
  ]);

  return (
    <div>
      <AdminNav />
      <OrdersSubNav />
      <h1 className="p-4 text-xl font-bold">예약 설정</h1>
      <div className="p-4">
        <AvailabilitySettings
          closedWeekdays={settings.closed_weekdays ?? []}
          closedDates={closedDates}
          blockedTimes={blockedTimes}
        />
      </div>
    </div>
  );
}
