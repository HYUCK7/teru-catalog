export function isDesignSelectionRequired(
  designEnabled: boolean,
  imageCount: number,
): boolean {
  return designEnabled && imageCount >= 2;
}

type DesignSelectionResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export function validateDesignSelection(
  selected: string,
  imageUrls: string[],
): DesignSelectionResult {
  const url = selected.trim();
  if (!url) return { ok: false, error: "디자인을 선택해주세요." };
  if (!imageUrls.includes(url)) {
    return { ok: false, error: "선택할 수 없는 디자인이에요." };
  }

  return { ok: true, url };
}
