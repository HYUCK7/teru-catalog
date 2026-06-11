"use client";

import { useState } from "react";
import type {
  CategoryChoice,
  ChoiceKind,
  SelectedChoice,
} from "@/lib/supabase/types";
import { sumChoicePrice } from "@/lib/customization";

const GROUPS: {
  kind: ChoiceKind;
  title: string;
  inputName: string;
}[] = [
  { kind: "flavor", title: "맛 선택", inputName: "selected_flavor" },
  { kind: "option", title: "옵션 선택", inputName: "selected_option" },
];

export function ProductCustomizer({
  basePrice,
  flavorEnabled,
  optionEnabled,
  flavorChoices,
  optionChoices,
}: {
  basePrice: number;
  flavorEnabled: boolean;
  optionEnabled: boolean;
  flavorChoices: CategoryChoice[];
  optionChoices: CategoryChoice[];
}) {
  const [selected, setSelected] = useState<Record<ChoiceKind, string[]>>({
    flavor: [],
    option: [],
  });

  const enabledGroups = GROUPS.filter((group) =>
    group.kind === "flavor" ? flavorEnabled : optionEnabled,
  );
  const choicesByKind = {
    flavor: flavorChoices,
    option: optionChoices,
  };

  const selectedSnapshot: SelectedChoice[] = enabledGroups.flatMap((group) => {
    const byLabel = new Map(
      choicesByKind[group.kind].map((choice) => [choice.label, choice]),
    );
    return selected[group.kind].flatMap((label) => {
      const choice = byLabel.get(label);
      return choice
        ? [{ label: choice.label, price: choice.price, kind: choice.kind }]
        : [];
    });
  });

  if (enabledGroups.length === 0) return null;

  const extraPrice = sumChoicePrice(selectedSnapshot);
  const totalPrice = basePrice + extraPrice;

  function toggle(kind: ChoiceKind, label: string) {
    setSelected((current) => {
      const exists = current[kind].includes(label);
      return {
        ...current,
        [kind]: exists
          ? current[kind].filter((item) => item !== label)
          : [...current[kind], label],
      };
    });
  }

  return (
    <section className="space-y-4 rounded border p-3">
      {enabledGroups.map((group) => {
        const choices = choicesByKind[group.kind];
        return (
          <div key={group.kind} className="space-y-2">
            <p className="text-sm font-medium">{group.title} (선택)</p>
            {choices.length === 0 ? (
              <p className="text-sm text-gray-500">등록된 항목이 없습니다.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {choices.map((choice) => {
                  const checked = selected[group.kind].includes(choice.label);
                  return (
                    <label
                      key={choice.id}
                      className={`flex min-h-10 items-center justify-between gap-2 rounded border px-3 py-2 text-sm ${
                        checked ? "border-black bg-black text-white" : ""
                      }`}
                    >
                      <span>{choice.label}</span>
                      {choice.price > 0 && (
                        <span className="text-xs">
                          +{choice.price.toLocaleString()}원
                        </span>
                      )}
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => toggle(group.kind, choice.label)}
                      />
                    </label>
                  );
                })}
              </div>
            )}
            {selected[group.kind].map((label) => (
              <input
                key={`${group.kind}-${label}`}
                type="hidden"
                name={group.inputName}
                value={label}
              />
            ))}
          </div>
        );
      })}

      <div className="space-y-1 border-t pt-3 text-sm">
        <p className="flex justify-between">
          <span>추가 금액</span>
          <span>{extraPrice.toLocaleString()}원</span>
        </p>
        <p className="flex justify-between font-semibold">
          <span>예상 합계</span>
          <span>{totalPrice.toLocaleString()}원</span>
        </p>
      </div>
    </section>
  );
}
