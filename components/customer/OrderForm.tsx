"use client";

import { submitOrder } from "@/actions/orders";
import { DesignPicker } from "@/components/customer/DesignPicker";
import { PickupScheduler } from "@/components/customer/PickupScheduler";
import { ProductCustomizer } from "@/components/customer/ProductCustomizer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  CategoryChoice,
  Product,
  ProductImage,
} from "@/lib/supabase/types";
import { useActionState } from "react";

export function OrderForm({
  product,
  designRequired,
  designImages,
  flavorChoices,
  optionChoices,
  closedWeekdays,
  closedDates,
  blockedByDate,
}: {
  product: Product;
  designRequired: boolean;
  designImages: ProductImage[];
  flavorChoices: CategoryChoice[];
  optionChoices: CategoryChoice[];
  closedWeekdays: number[];
  closedDates: string[];
  blockedByDate: Record<string, string[]>;
}) {
  const action = submitOrder.bind(null, product.id);
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4 p-4">
      <div className="rounded border p-3">
        <p className="font-bold">{product.name}</p>
        <p className="text-sm text-gray-600">
          {product.price.toLocaleString()}원
        </p>
      </div>
      {state?.errors?.product && (
        <p className="text-sm text-red-600">{state.errors.product}</p>
      )}
      {state?.errors?.choices && (
        <p className="text-sm text-red-600">{state.errors.choices}</p>
      )}

      <ProductCustomizer
        basePrice={product.price}
        flavorEnabled={product.flavor_enabled}
        optionEnabled={product.option_enabled}
        flavorChoices={flavorChoices}
        optionChoices={optionChoices}
      />

      {designRequired && (
        <DesignPicker images={designImages} error={state?.errors?.design} />
      )}

      <div>
        <Label htmlFor="customer_name">주문자 이름</Label>
        <Input id="customer_name" name="customer_name" />
        {state?.errors?.customerName && (
          <p className="text-sm text-red-600">{state.errors.customerName}</p>
        )}
      </div>

      <div>
        <Label htmlFor="phone">연락처</Label>
        <Input id="phone" name="phone" type="tel" inputMode="tel" />
        {state?.errors?.phone && (
          <p className="text-sm text-red-600">{state.errors.phone}</p>
        )}
      </div>

      <input type="hidden" name="quantity" value={1} />
      {state?.errors?.quantity && (
        <p className="text-sm text-red-600">{state.errors.quantity}</p>
      )}

      <PickupScheduler
        closedWeekdays={closedWeekdays}
        closedDates={closedDates}
        blockedByDate={blockedByDate}
        dateError={state?.errors?.pickupDate}
        timeError={state?.errors?.pickupTime}
      />

      <div>
        <Label htmlFor="lettering">레터링 문구 (선택)</Label>
        <Input id="lettering" name="lettering" />
      </div>

      <div>
        <Label htmlFor="request_memo">추가 요청사항 (선택)</Label>
        <Textarea id="request_memo" name="request_memo" />
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "접수 중..." : "다음"}
      </Button>
    </form>
  );
}
