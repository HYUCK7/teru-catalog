"use server";

import { revalidatePath } from "next/cache";
import {
  addBlockedTimes,
  addClosedDate,
  removeBlockedTime,
  removeClosedDate,
  updateClosedWeekdays,
} from "@/lib/data/availability";
import { createClient } from "@/lib/supabase/server";

export async function saveClosedWeekdays(weekdays: number[]) {
  const supabase = await createClient();
  await updateClosedWeekdays(supabase, weekdays);
  revalidatePath("/admin/orders/availability");
}

export async function addClosedDateAction(date: string) {
  if (!date) return;
  const supabase = await createClient();
  await addClosedDate(supabase, date);
  revalidatePath("/admin/orders/availability");
}

export async function removeClosedDateAction(date: string) {
  const supabase = await createClient();
  await removeClosedDate(supabase, date);
  revalidatePath("/admin/orders/availability");
}

export async function addBlockedTimesAction(date: string, times: string[]) {
  if (!date || times.length === 0) return;
  const supabase = await createClient();
  await addBlockedTimes(supabase, date, times);
  revalidatePath("/admin/orders/availability");
}

export async function removeBlockedTimeAction(id: string) {
  const supabase = await createClient();
  await removeBlockedTime(supabase, id);
  revalidatePath("/admin/orders/availability");
}
