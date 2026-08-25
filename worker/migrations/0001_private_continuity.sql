PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sync_users (
  user_id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_items (
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('saved', 'prayer')),
  source_people_id INTEGER NOT NULL CHECK (source_people_id > 0),
  present INTEGER NOT NULL CHECK (present IN (0, 1)),
  payload_json TEXT,
  last_prayed_at TEXT,
  revision INTEGER NOT NULL CHECK (revision >= 0),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, kind, source_people_id),
  FOREIGN KEY (user_id) REFERENCES sync_users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sync_mutations (
  user_id TEXT NOT NULL,
  mutation_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, mutation_id),
  FOREIGN KEY (user_id) REFERENCES sync_users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS sync_items_user_revision_idx
  ON sync_items(user_id, revision);

CREATE INDEX IF NOT EXISTS sync_mutations_user_created_idx
  ON sync_mutations(user_id, created_at);
