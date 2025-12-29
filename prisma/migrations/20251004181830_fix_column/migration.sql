/*
  Warnings:

  - You are about to drop the column `transactionId` on the `OtpToken` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."OtpToken_transactionId_idx";

-- DropIndex
DROP INDEX "public"."OtpToken_transactionId_key";

-- AlterTable
ALTER TABLE "public"."OtpToken" DROP COLUMN "transactionId";
