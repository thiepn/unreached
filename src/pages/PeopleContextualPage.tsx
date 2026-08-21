import { EditorialContextPanel } from "../components/EditorialContextPanel";
import { PrayerProfilePanel } from "../components/PrayerProfilePanel";
import { PeoplePage } from "./PeoplePage";

export function PeopleContextualPage({ sourcePeopleId }: { sourcePeopleId: number }) {
  return (
    <>
      <PeoplePage sourcePeopleId={sourcePeopleId} />
      <EditorialContextPanel sourcePeopleId={sourcePeopleId} />
      <PrayerProfilePanel sourcePeopleId={sourcePeopleId} />
    </>
  );
}
