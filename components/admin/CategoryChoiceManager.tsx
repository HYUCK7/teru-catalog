"use client";

import { useState, useTransition } from "react";
import {
  addChoice,
  deleteChoice,
  editChoice,
} from "@/actions/category-choices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CategoryChoice, ChoiceKind } from "@/lib/supabase/types";
import { MAX_INT_PRICE } from "@/lib/validation";

const GROUP_LABELS: Record<ChoiceKind, string> = {
  flavor: "맛 항목",
  option: "옵션 항목",
};

export function CategoryChoiceManager({
  categoryId,
  choices,
}: {
  categoryId: string;
  choices: CategoryChoice[];
}) {
  const [message, setMessage] = useState("");

  return (
    <div className="space-y-4 border-t pt-3">
      {message && <p className="text-sm text-red-600">{message}</p>}
      {(["flavor", "option"] as ChoiceKind[]).map((kind) => (
        <ChoiceGroup
          key={kind}
          categoryId={categoryId}
          kind={kind}
          choices={choices.filter((choice) => choice.kind === kind)}
          onMessage={setMessage}
        />
      ))}
    </div>
  );
}

function ChoiceGroup({
  categoryId,
  kind,
  choices,
  onMessage,
}: {
  categoryId: string;
  kind: ChoiceKind;
  choices: CategoryChoice[];
  onMessage: (message: string) => void;
}) {
  return (
    <section className="space-y-2">
      <p className="text-sm font-medium text-gray-700">{GROUP_LABELS[kind]}</p>
      <ul className="space-y-2">
        {choices.map((choice) => (
          <ChoiceEditForm
            key={choice.id}
            choice={choice}
            onMessage={onMessage}
          />
        ))}
      </ul>
      <ChoiceAddForm
        categoryId={categoryId}
        kind={kind}
        onMessage={onMessage}
      />
    </section>
  );
}

function ChoiceEditForm({
  choice,
  onMessage,
}: {
  choice: CategoryChoice;
  onMessage: (message: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    onMessage("");
    startTransition(async () => {
      const result = await editChoice(formData);
      if (!result.ok) onMessage(result.error);
    });
  }

  function handleDelete() {
    onMessage("");
    startTransition(async () => {
      const result = await deleteChoice(choice.id);
      if (!result.ok) onMessage(result.error);
    });
  }

  return (
    <li>
      <form action={handleSubmit} className="flex items-center gap-2">
        <input type="hidden" name="choice_id" value={choice.id} />
        <Input
          name="label"
          defaultValue={choice.label}
          aria-label="항목 이름"
          className="min-w-0 flex-1"
        />
        <Input
          name="price"
          type="number"
          min={0}
          max={MAX_INT_PRICE}
          step={1}
          defaultValue={choice.price}
          aria-label="추가 금액"
          className="w-24"
        />
        <Button type="submit" variant="outline" size="sm" disabled={isPending}>
          저장
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={isPending}
          onClick={handleDelete}
        >
          삭제
        </Button>
      </form>
    </li>
  );
}

function ChoiceAddForm({
  categoryId,
  kind,
  onMessage,
}: {
  categoryId: string;
  kind: ChoiceKind;
  onMessage: (message: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    onMessage("");
    startTransition(async () => {
      const result = await addChoice(formData);
      if (!result.ok) onMessage(result.error);
    });
  }

  return (
    <form action={handleSubmit} className="flex items-center gap-2">
      <input type="hidden" name="category_id" value={categoryId} />
      <input type="hidden" name="kind" value={kind} />
      <Input
        name="label"
        placeholder={`${GROUP_LABELS[kind]} 추가`}
        aria-label="항목 이름"
        className="min-w-0 flex-1"
      />
      <Input
        name="price"
        type="number"
        min={0}
        max={MAX_INT_PRICE}
        step={1}
        defaultValue={0}
        aria-label="추가 금액"
        className="w-24"
      />
      <Button type="submit" size="sm" disabled={isPending}>
        추가
      </Button>
    </form>
  );
}
