ALTER TABLE sync_mutations ADD COLUMN claim_token TEXT;
ALTER TABLE sync_mutations ADD COLUMN outcome TEXT;
ALTER TABLE sync_mutations ADD COLUMN applied_revision INTEGER;

CREATE INDEX IF NOT EXISTS sync_mutations_claim_idx
  ON sync_mutations(user_id, mutation_id, claim_token);
