-- Remove default value from TournamentCategory.type column
ALTER TABLE "public"."TournamentCategory" ALTER COLUMN "type" DROP DEFAULT;
