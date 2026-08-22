import { EditorialContextPanel } from "../components/EditorialContextPanel";
import { PeoplePage } from "./PeoplePage";

export function PeopleContextualPage({ sourcePeopleId }: { sourcePeopleId: number }) {
  return (
    <>
      <PeoplePage sourcePeopleId={sourcePeopleId} />
      <EditorialContextPanel sourcePeopleId={sourcePeopleId} />
    </>
  );
}
