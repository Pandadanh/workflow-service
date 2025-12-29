/*
  Warnings:

  - You are about to drop the column `slot` on the `BadmintonBooking` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."BadmintonBooking" DROP COLUMN "slot";

-- AlterTable
ALTER TABLE "public"."BookingMember" ADD COLUMN     "slot" INTEGER NOT NULL DEFAULT 1;
