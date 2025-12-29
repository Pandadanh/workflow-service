-- CreateEnum
CREATE TYPE "public"."TournamentStatus" AS ENUM ('PENDING_REGISTRATION', 'IN_PROCESS', 'COMPLETED', 'CANCELLED', 'DRAFT');

-- CreateEnum
CREATE TYPE "public"."MatchType" AS ENUM ('SINGLE', 'DOUBLE', 'TEAM');

-- CreateEnum
CREATE TYPE "public"."GenderType" AS ENUM ('MALE', 'FEMALE', 'MIXED');

-- CreateEnum
CREATE TYPE "public"."MatchStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'FINISHED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."Tournament" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "host_id" UUID NOT NULL,
    "court_id" UUID,
    "rules" TEXT,
    "link_url" TEXT,
    "properties" JSONB,
    "time_start" TIMESTAMP(3),
    "time_end" TIMESTAMP(3),
    "status" "public"."TournamentStatus" NOT NULL DEFAULT 'DRAFT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TournamentDetail" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "type" "public"."MatchType" NOT NULL,
    "gender_type" "public"."GenderType",
    "slot" INTEGER,
    "skill_level" TEXT,
    "rules" TEXT,
    "prizes" TEXT,
    "price" DECIMAL(12,2),
    "price_men" DECIMAL(12,2),
    "price_women" DECIMAL(12,2),
    "time_start" TIMESTAMP(3),
    "time_end" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "TournamentDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TournamentCategory" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "TournamentCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TournamentTeam" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "tournament_detail_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "captain_id" UUID,
    "slots_member" JSONB NOT NULL,
    "members_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "TournamentTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Player" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "tournament_detail_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "team_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TournamentMatch" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "tournament_detail_id" UUID NOT NULL,
    "court_id" UUID,
    "court_name" TEXT,
    "match_type" "public"."MatchType" NOT NULL,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "team_home_id" UUID NOT NULL,
    "team_guest_id" UUID NOT NULL,
    "winner_id" UUID,
    "status" "public"."MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_name_court_id_key" ON "public"."Tournament"("name", "court_id");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentCategory_name_key" ON "public"."TournamentCategory"("name");

-- CreateIndex
CREATE INDEX "TournamentTeam_tournament_detail_id_idx" ON "public"."TournamentTeam"("tournament_detail_id");

-- CreateIndex
CREATE INDEX "TournamentTeam_captain_id_idx" ON "public"."TournamentTeam"("captain_id");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentTeam_tournament_id_tournament_detail_id_name_key" ON "public"."TournamentTeam"("tournament_id", "tournament_detail_id", "name");

-- CreateIndex
CREATE INDEX "Player_user_id_idx" ON "public"."Player"("user_id");

-- CreateIndex
CREATE INDEX "Player_team_id_idx" ON "public"."Player"("team_id");

-- CreateIndex
CREATE INDEX "Player_tournament_detail_id_idx" ON "public"."Player"("tournament_detail_id");

-- CreateIndex
CREATE UNIQUE INDEX "Player_tournament_id_tournament_detail_id_user_id_key" ON "public"."Player"("tournament_id", "tournament_detail_id", "user_id");

-- CreateIndex
CREATE INDEX "TournamentMatch_tournament_id_idx" ON "public"."TournamentMatch"("tournament_id");

-- CreateIndex
CREATE INDEX "TournamentMatch_status_idx" ON "public"."TournamentMatch"("status");

-- CreateIndex
CREATE INDEX "TournamentMatch_match_type_idx" ON "public"."TournamentMatch"("match_type");

-- AddForeignKey
ALTER TABLE "public"."Tournament" ADD CONSTRAINT "Tournament_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tournament" ADD CONSTRAINT "Tournament_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "public"."BadmintonCourt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentDetail" ADD CONSTRAINT "TournamentDetail_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentDetail" ADD CONSTRAINT "TournamentDetail_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."TournamentCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentTeam" ADD CONSTRAINT "TournamentTeam_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentTeam" ADD CONSTRAINT "TournamentTeam_tournament_detail_id_fkey" FOREIGN KEY ("tournament_detail_id") REFERENCES "public"."TournamentDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Player" ADD CONSTRAINT "Player_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Player" ADD CONSTRAINT "Player_tournament_detail_id_fkey" FOREIGN KEY ("tournament_detail_id") REFERENCES "public"."TournamentDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Player" ADD CONSTRAINT "Player_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."TournamentTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Player" ADD CONSTRAINT "Player_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentMatch" ADD CONSTRAINT "TournamentMatch_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentMatch" ADD CONSTRAINT "TournamentMatch_tournament_detail_id_fkey" FOREIGN KEY ("tournament_detail_id") REFERENCES "public"."TournamentDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentMatch" ADD CONSTRAINT "TournamentMatch_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "public"."BadmintonCourt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentMatch" ADD CONSTRAINT "TournamentMatch_team_home_id_fkey" FOREIGN KEY ("team_home_id") REFERENCES "public"."TournamentTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentMatch" ADD CONSTRAINT "TournamentMatch_team_guest_id_fkey" FOREIGN KEY ("team_guest_id") REFERENCES "public"."TournamentTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentMatch" ADD CONSTRAINT "TournamentMatch_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "public"."TournamentTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
