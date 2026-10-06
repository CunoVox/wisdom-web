import { MorphIcon } from "morphicons/react";
import { ChevronDown, ChevronUp, Grid2X2, X, Upload, Check } from "lucide";

export function MorphSymbol({ active, kind = "chevron", size = 18 }: { active: boolean; kind?: "chevron" | "category" | "upload"; size?: number }) {
  const pair = kind === "category" ? [Grid2X2, X] : kind === "upload" ? [Upload, Check] : [ChevronDown, ChevronUp];
  // Lucide 0.468 wraps its drawing nodes in an outer svg tuple.
  const nodes = pair[active ? 1 : 0][2]?.map(([tag, attrs]) => [tag, Object.fromEntries(Object.entries(attrs).map(([key, value]) => [key, String(value)]))] as const) || [];
  return <MorphIcon icon={nodes} size={size} strokeWidth={1.8} spring="snappy" reducedMotion="user" />;
}
