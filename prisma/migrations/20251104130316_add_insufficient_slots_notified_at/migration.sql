/*
  Warnings:

  - You are about to drop the `Report` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."ReportOwnerStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CLOSED');

-- DropForeignKey
ALTER TABLE "public"."Report" DROP CONSTRAINT "Report_booking_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Report" DROP CONSTRAINT "Report_reported_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Report" DROP CONSTRAINT "Report_reporter_id_fkey";

-- AlterTable
ALTER TABLE "public"."BadmintonBooking" ADD COLUMN     "insufficient_slots_notified_at" TIMESTAMP(3);

-- DropTable
DROP TABLE "public"."Report";

-- CreateTable
CREATE TABLE "public"."ReportMatching" (
    "id" UUID NOT NULL,
    "reported_user_id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "booking_id" UUID,
    "note" TEXT,
    "properties" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "ReportMatching_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReportOwner" (
    "id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "booking_id" UUID,
    "court_id" UUID,
    "reason" TEXT,
    "note" TEXT,
    "properties" JSONB,
    "status" "public"."ReportOwnerStatus" NOT NULL DEFAULT 'PENDING',
    "rating" SMALLINT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "ReportOwner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BadmintonBooking_insufficient_slots_notified_at_idx" ON "public"."BadmintonBooking"("insufficient_slots_notified_at");

-- AddForeignKey
ALTER TABLE "public"."ReportMatching" ADD CONSTRAINT "ReportMatching_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportMatching" ADD CONSTRAINT "ReportMatching_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportMatching" ADD CONSTRAINT "ReportMatching_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."BadmintonBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportOwner" ADD CONSTRAINT "ReportOwner_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportOwner" ADD CONSTRAINT "ReportOwner_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportOwner" ADD CONSTRAINT "ReportOwner_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "public"."BadmintonCourt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportOwner" ADD CONSTRAINT "ReportOwner_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."BadmintonBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
