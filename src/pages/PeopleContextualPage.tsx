import { PeoplePage } from "./PeoplePage";

/**
 * The route wrapper remains for lazy-loading compatibility, but Phase 8 moves
 * reviewed/source editorial depth inside the definitive people profile instead
 * of appending a second disconnected article below it.
 */
export function PeopleContextualPage({ sourcePeopleId }: { sourcePeopleId: number }) {
  return <PeoplePage sourcePeopleId={sourcePeopleId} />;
}
