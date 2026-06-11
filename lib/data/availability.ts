import type { SupabaseClient } from "@supabase/supabase-js";
import type { BlockedTime } from "@/lib/supabase/types";

export async function getClosedDates(
  supabase: SupabaseClient,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("closed_dates")
    .select("closed_date")
    .order("closed_date", { ascending: true });

  if (error) throw new Error(error.message);

  return ((data ?? []) as { closed_date: string }[]).map(
    (row) => row.closed_date,
  );
}

export async function getBlockedTimes(
  supabase: SupabaseClient,
): Promise<BlockedTime[]> {
  const { data, error } = await supabase
    .from("blocked_times")
    .select("*")
    .order("block_date", { ascending: true })
    .order("block_time", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []) as BlockedTime[];
}

export async function addClosedDate(
  supabase: SupabaseClient,
  date: string,
): Promise<void> {
  const { error } = await supabase
    .from("closed_dates")
    .upsert({ closed_date: date });

  if (error) throw new Error(error.message);
}

export async function removeClosedDate(
  supabase: SupabaseClient,
  date: string,
): Promise<void> {
  const { error } = await supabase
    .from("closed_dates")
    .delete()
    .eq("closed_date", date);

  if (error) throw new Error(error.message);
}

export async function addBlockedTimes(
  supabase: SupabaseClient,
  date: string,
  times: string[],
): Promise<void> {
  if (times.length === 0) return;

  const rows = times.map((time) => ({ block_date: date, block_time: time }));
  const { error } = await supabase
    .from("blocked_times")
    .upsert(rows, { onConflict: "block_date,block_time" });

  if (error) throw new Error(error.message);
}

export async function removeBlockedTime(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("blocked_times").delete().eq("id", id);

  if (error) throw new Error(error.message);
}

export async function updateClosedWeekdays(
  supabase: SupabaseClient,
  weekdays: number[],
): Promise<void> {
  const { error } = await supabase
    .from("site_settings")
    .update({ closed_weekdays: weekdays })
    .eq("id", 1);

  if (error) throw new Error(error.message);
}
