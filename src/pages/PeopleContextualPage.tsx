import { ProfileLocalActions } from "../components/ProfileLocalActions";
import { PeoplePage } from "./PeoplePage";

export function PeopleContextualPage({ sourcePeopleId }: { sourcePeopleId: number }) {
  return (
    <>
      <PeoplePage sourcePeopleId={sourcePeopleId} />
      <ProfileLocalActions sourcePeopleId={sourcePeopleId} />
    </>
  );
}
