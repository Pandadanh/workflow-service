-- Add Glicko rating fields to UserRank
ALTER TABLE "UserRank" ADD COLUMN "rating" DOUBLE PRECISION NOT NULL DEFAULT 1500;
ALTER TABLE "UserRank" ADD COLUMN "rating_deviation" DOUBLE PRECISION NOT NULL DEFAULT 350;
ALTER TABLE "UserRank" ADD COLUMN "volatility" DOUBLE PRECISION NOT NULL DEFAULT 0.06;
ALTER TABLE "UserRank" ADD COLUMN "last_match_at" TIMESTAMP(3);

-- Create RatingHistory table for tracking rating changes
CREATE TABLE "RatingHistory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "match_id" UUID NOT NULL,
    "rating_before" DOUBLE PRECISION NOT NULL,
    "rating_after" DOUBLE PRECISION NOT NULL,
    "rating_change" DOUBLE PRECISION NOT NULL,
    "rd_before" DOUBLE PRECISION NOT NULL,
    "rd_after" DOUBLE PRECISION NOT NULL,
    "volatility_before" DOUBLE PRECISION,
    "volatility_after" DOUBLE PRECISION,
    "opponent_rating" DOUBLE PRECISION NOT NULL,
    "opponent_rd" DOUBLE PRECISION NOT NULL,
    "match_result" VARCHAR(10) NOT NULL,
    "team_number" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,
    "properties" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,

    CONSTRAINT "RatingHistory_pkey" PRIMARY KEY ("id")
);

-- Create indexes for RatingHistory
CREATE INDEX "RatingHistory_user_id_idx" ON "RatingHistory"("user_id");
CREATE INDEX "RatingHistory_match_id_idx" ON "RatingHistory"("match_id");
CREATE INDEX "RatingHistory_created_at_idx" ON "RatingHistory"("created_at");
CREATE INDEX "RatingHistory_user_id_created_at_idx" ON "RatingHistory"("user_id", "created_at" DESC);

-- Add foreign key constraint
ALTER TABLE "RatingHistory" ADD CONSTRAINT "RatingHistory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create index on UserRank rating for leaderboards
CREATE INDEX "UserRank_rating_idx" ON "UserRank"("rating" DESC);
