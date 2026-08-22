import { ArrowLeft } from "lucide-preact";

import { hrefFor } from "../app/router";

export function NotFoundPage() {
  return (
    <section class="not-found">
      <div class="eyebrow">404</div>
      <h1 class="display-title">This route is not on the map.</h1>
      <p class="lead">
        The requested Unreached page does not exist in the current application architecture.
      </p>
      <a class="text-link" href={hrefFor("/")}>
        <ArrowLeft size={16} aria-hidden="true" />
        Return to Explore
      </a>
    </section>
  );
}
