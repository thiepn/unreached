import type { ComponentChildren } from "preact";

export type StatusTone = "neutral" | "info" | "unreached" | "frontier" | "progress";

export function StatusChip({
  tone = "neutral",
  children
}: {
  tone?: StatusTone;
  children: ComponentChildren;
}) {
  return <span class={`status-chip status-chip--${tone}`}>{children}</span>;
}
