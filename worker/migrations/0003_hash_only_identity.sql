ALTER TABLE sync_users ADD COLUMN identity_hash TEXT;

UPDATE sync_users
SET email = user_id,
    identity_hash = user_id;

CREATE TRIGGER IF NOT EXISTS sync_users_hash_only_after_insert
AFTER INSERT ON sync_users
BEGIN
  UPDATE sync_users
  SET email = NEW.user_id,
      identity_hash = NEW.user_id
  WHERE user_id = NEW.user_id;
END;

CREATE TRIGGER IF NOT EXISTS sync_users_hash_only_after_email_update
AFTER UPDATE OF email ON sync_users
WHEN NEW.email <> NEW.user_id OR NEW.identity_hash IS NULL OR NEW.identity_hash <> NEW.user_id
BEGIN
  UPDATE sync_users
  SET email = NEW.user_id,
      identity_hash = NEW.user_id
  WHERE user_id = NEW.user_id;
END;

CREATE INDEX IF NOT EXISTS sync_users_identity_hash_idx
  ON sync_users(identity_hash);
