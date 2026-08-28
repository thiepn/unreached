ALTER TABLE sync_users RENAME COLUMN email TO identity_hash;
UPDATE sync_users SET identity_hash = user_id;
