# Local Personalization Privacy

U10 personalization is intentionally browser-local.

Stored locally:

- people groups explicitly saved for prayer
- up to 12 recently opened people, country and language profiles

Not stored or transmitted by U10:

- prayer completion history
- prayer duration
- prayer frequency
- account identity
- device identity
- cloud synchronization state
- analytics events

Clearing the browser's site storage removes this local state. The application treats failure or denial of localStorage access as a recoverable condition rather than a fatal error.
