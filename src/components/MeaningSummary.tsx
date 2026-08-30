import { peopleMeaning } from "../comprehension/explain";
import type { RuntimePeopleEntity } from "../providers/peoplegroups";
import { TermHelp } from "./TermHelp";

export function MeaningSummary({ record }: { record: RuntimePeopleEntity }) {
  return (
    <div class="meaning-summary" role="note">
      <p>{peopleMeaning(record)}</p>
      <TermHelp term="people-group" prompt="What is a people group?" />
    </div>
  );
}
