import { Info } from "lucide-preact";

import { definitionFor, type ComprehensionTerm } from "../comprehension/definitions";

export function TermHelp({ term, prompt }: { term: ComprehensionTerm; prompt?: string }) {
  const definition = definitionFor(term);

  return (
    <details class="term-help">
      <summary>
        <Info size={14} aria-hidden="true" />
        <span>{prompt ?? `What does ${definition.label.toLowerCase()} mean?`}</span>
      </summary>
      <div class="term-help__body">
        <strong>{definition.label}</strong>
        <p>{definition.short}</p>
        <p>{definition.detail}</p>
      </div>
    </details>
  );
}
