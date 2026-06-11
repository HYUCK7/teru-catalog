import { BackButton } from "@/components/BackButton";
import { OrderForm } from "@/components/customer/OrderForm";
import { blockedTimesByDate } from "@/lib/availability";
import { isDesignSelectionRequired } from "@/lib/design-selection";
import { getBlockedTimes, getClosedDates } from "@/lib/data/availability";
import { getChoicesByCategory } from "@/lib/data/category-choices";
import { getCategoryById } from "@/lib/data/categories";
import { getProductWithImages } from "@/lib/data/products";
import { getSettings } from "@/lib/data/settings";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const product = await getProductWithImages(supabase, id);

  if (!product || !product.is_visible) notFound();

  const [settings, closedDates, blockedTimes, choices, category] =
    await Promise.all([
      getSettings(supabase),
      getClosedDates(supabase),
      getBlockedTimes(supabase),
      product.category_id
        ? getChoicesByCategory(supabase, product.category_id)
        : Promise.resolve([]),
      product.category_id
        ? getCategoryById(supabase, product.category_id)
        : Promise.resolve(null),
    ]);
  const flavorChoices = choices.filter((choice) => choice.kind === "flavor");
  const optionChoices = choices.filter((choice) => choice.kind === "option");
  const designRequired = isDesignSelectionRequired(
    category?.design_enabled ?? false,
    product.images.length,
  );

  return (
    <main className="mx-auto max-w-md pb-8">
      <div className="p-4">
        <BackButton label="뒤로" />
      </div>
      <h1 className="px-4 text-lg font-bold">주문서</h1>
      <OrderForm
        product={product}
        designRequired={designRequired}
        designImages={product.images}
        flavorChoices={flavorChoices}
        optionChoices={optionChoices}
        closedWeekdays={settings.closed_weekdays ?? []}
        closedDates={closedDates}
        blockedByDate={blockedTimesByDate(blockedTimes)}
      />
    </main>
  );
}
