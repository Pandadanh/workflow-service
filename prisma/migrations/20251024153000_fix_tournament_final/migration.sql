-- Fix Tournament table: Remove unique index on (name, court_id)
DROP INDEX IF EXISTS "Tournament_name_court_id_key";

-- Fix TournamentCategory table: Add type column
ALTER TABLE "public"."TournamentCategory" ADD COLUMN IF NOT EXISTS "type" "public"."MatchType" NOT NULL DEFAULT 'SINGLE';
