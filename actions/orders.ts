"use server";

import { isDateClosed, isTimeBlocked } from "@/lib/availability";
import { sumChoicePrice, validateChoiceSelection } from "@/lib/customization";
import { getBlockedTimes, getClosedDates } from "@/lib/data/availability";
import { getCategoryById } from "@/lib/data/categories";
import { getChoicesByCategory } from "@/lib/data/category-choices";
import { createOrder, setOrderStatus } from "@/lib/data/orders";
import { getProductWithImages } from "@/lib/data/products";
import { getSettings } from "@/lib/data/settings";
import {
  isDesignSelectionRequired,
  validateDesignSelection,
} from "@/lib/design-selection";
import { isOrderStatus } from "@/lib/order-status";
import { isPickupDateAllowed } from "@/lib/pickup-date";
import { isPickupTimeAllowed } from "@/lib/pickup-time";
import { createClient } from "@/lib/supabase/server";
import type { SelectedChoice } from "@/lib/supabase/types";
import { validateOrderInput } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type SubmitResult = { ok: boolean; errors: Record<string, string> };

export async function submitOrder(
  productId: string,
  _prev: unknown,
  formData: FormData,
): Promise<SubmitResult> {
  const customerName = String(formData.get("customer_name") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  const pickupDate = String(formData.get("pickup_date") ?? "");
  const pickupTime = String(formData.get("pickup_time") ?? "");
  const lettering = String(formData.get("lettering") ?? "");
  const requestMemo = String(formData.get("request_memo") ?? "");
  const selectedFlavor = formData.getAll("selected_flavor").map(String);
  const selectedOption = formData.getAll("selected_option").map(String);
  const selectedDesign = String(formData.get("design_image_url") ?? "");

  const validation = validateOrderInput({
    customerName,
    phone,
    quantity,
    pickupDate,
    pickupTime,
  });

  const errors = { ...validation.errors };
  if (
    pickupDate &&
    !errors.pickupDate &&
    !isPickupDateAllowed(pickupDate, new Date())
  ) {
    errors.pickupDate =
      "픽업 날짜는 내일부터 올해 말일까지만 선택할 수 있어요.";
  }
  if (pickupTime && !errors.pickupTime && !isPickupTimeAllowed(pickupTime)) {
    errors.pickupTime =
      "픽업 시간은 10:00 ~ 22:00, 30분 간격으로만 선택할 수 있어요.";
  }

  const supabase = await createClient();

  // 휴무일/제외 시간 재검증 (관리자 설정 기준)
  if (pickupDate && pickupTime && !errors.pickupDate && !errors.pickupTime) {
    const [settings, closedDates, blockedTimes] = await Promise.all([
      getSettings(supabase),
      getClosedDates(supabase),
      getBlockedTimes(supabase),
    ]);
    if (isDateClosed(pickupDate, settings.closed_weekdays ?? [], closedDates)) {
      errors.pickupDate = "선택하신 날짜는 휴무일이에요.";
    } else if (isTimeBlocked(pickupDate, pickupTime, blockedTimes)) {
      errors.pickupTime = "선택하신 시간은 예약할 수 없어요.";
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const product = await getProductWithImages(supabase, productId);
  if (!product || !product.is_visible) {
    return { ok: false, errors: { product: "상품을 찾을 수 없습니다." } };
  }

  const category = product.category_id
    ? await getCategoryById(supabase, product.category_id)
    : null;
  const designRequired = isDesignSelectionRequired(
    category?.design_enabled ?? false,
    product.images.length,
  );
  let designImageUrl = "";
  if (designRequired) {
    const result = validateDesignSelection(
      selectedDesign,
      product.images.map((image) => image.image_url),
    );
    if (!result.ok) return { ok: false, errors: { design: result.error } };
    designImageUrl = result.url;
  }

  let selectedChoices: SelectedChoice[] = [];
  if (
    product.category_id &&
    (product.flavor_enabled || product.option_enabled)
  ) {
    const choices = await getChoicesByCategory(supabase, product.category_id);
    const flavorChoices = choices.filter((choice) => choice.kind === "flavor");
    const optionChoices = choices.filter((choice) => choice.kind === "option");

    if (product.flavor_enabled) {
      const result = validateChoiceSelection(selectedFlavor, flavorChoices);
      if (!result.ok) return { ok: false, errors: { choices: result.error } };
      selectedChoices = selectedChoices.concat(result.snapshot);
    }

    if (product.option_enabled) {
      const result = validateChoiceSelection(selectedOption, optionChoices);
      if (!result.ok) return { ok: false, errors: { choices: result.error } };
      selectedChoices = selectedChoices.concat(result.snapshot);
    }
  }

  const totalAmount =
    (product.price + sumChoicePrice(selectedChoices)) * quantity;

  await createOrder(supabase, {
    productId,
    productName: product.name,
    quantity,
    customerName,
    phone,
    pickupDate,
    pickupTime,
    lettering,
    requestMemo,
    selectedChoices,
    designImageUrl,
    totalAmount,
  });
  const cookieStore = await cookies();
  cookieStore.set("order_amount", String(totalAmount), {
    httpOnly: true,
    sameSite: "lax",
    path: "/order/complete",
    maxAge: 60,
  });
  revalidatePath("/admin/orders");
  redirect("/order/complete");
}

export async function updateOrderStatus(id: string, status: string) {
  if (!isOrderStatus(status)) return;
  const supabase = await createClient();
  await setOrderStatus(supabase, id, status);
  revalidatePath("/admin/orders");
}
