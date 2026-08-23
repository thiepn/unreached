import { EditorialContextPanel } from "../components/EditorialContextPanel";
import { ProfileLocalActions } from "../components/ProfileLocalActions";
import { PeoplePage } from "./PeoplePage";

export function PeopleContextualPage({ sourcePeopleId }: { sourcePeopleId: number }) {
  return (
    <>
      <PeoplePage sourcePeopleId={sourcePeopleId} />
      <EditorialContextPanel peid={sourcePeopleId} />
      <ProfileLocalActions sourcePeopleId={sourcePeopleId} />
    </>
  );
}
