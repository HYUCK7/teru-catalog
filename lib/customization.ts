import type {
  CategoryChoice,
  ChoiceKind,
  SelectedChoice,
} from "@/lib/supabase/types";

export const CHOICE_KINDS: ChoiceKind[] = ["flavor", "option"];

export function isChoiceKind(value: string): value is ChoiceKind {
  return (CHOICE_KINDS as string[]).includes(value);
}

type ChoiceValidationResult =
  | { ok: true; snapshot: SelectedChoice[] }
  | { ok: false; error: string };

export function validateChoiceSelection(
  selectedLabels: string[],
  available: CategoryChoice[],
): ChoiceValidationResult {
  const uniqueLabels = [
    ...new Set(selectedLabels.map((label) => label.trim()).filter(Boolean)),
  ];
  const byLabel = new Map(available.map((choice) => [choice.label, choice]));

  const snapshot: SelectedChoice[] = [];
  for (const label of uniqueLabels) {
    const choice = byLabel.get(label);
    if (!choice) {
      return { ok: false, error: "선택할 수 없는 항목이 있어요." };
    }
    snapshot.push({
      label: choice.label,
      price: choice.price,
      kind: choice.kind,
    });
  }

  return { ok: true, snapshot };
}

export function sumChoicePrice(snapshot: SelectedChoice[]): number {
  return snapshot.reduce((total, choice) => total + choice.price, 0);
}
