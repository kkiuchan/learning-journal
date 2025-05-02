export type EffectType = "understanding" | "practical" | "application" | "none";

export function getEffectTypeLabel(type: EffectType): string {
  const labels: Record<EffectType, string> = {
    understanding: "理解が深まった",
    practical: "実際に使えるようになった",
    application: "応用のアイデアが生まれた",
    none: "特になかった",
  };
  return labels[type] || type;
}
