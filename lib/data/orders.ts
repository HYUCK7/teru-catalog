import type { SupabaseClient } from "@supabase/supabase-js";
import type { Order, OrderStatus, SelectedChoice } from "@/lib/supabase/types";

export type OrderWriteInput = {
  productId: string;
  productName: string;
  quantity: number;
  customerName: string;
  phone: string;
  pickupDate: string;
  pickupTime: string;
  lettering: string;
  requestMemo: string;
  selectedChoices: SelectedChoice[];
  designImageUrl: string;
};

export async function createOrder(
  supabase: SupabaseClient,
  input: OrderWriteInput,
): Promise<void> {
  const { error } = await supabase.from("orders").insert({
    product_id: input.productId,
    product_name: input.productName,
    quantity: input.quantity,
    customer_name: input.customerName,
    phone: input.phone,
    pickup_date: input.pickupDate,
    pickup_time: input.pickupTime,
    lettering: input.lettering,
    request_memo: input.requestMemo,
    selected_choices: input.selectedChoices,
    design_image_url: input.designImageUrl,
  });

  if (error) throw new Error(error.message);
}

export async function getOrders(supabase: SupabaseClient): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []) as Order[];
}

export async function setOrderStatus(
  supabase: SupabaseClient,
  id: string,
  status: OrderStatus,
): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error(error.message);
}
