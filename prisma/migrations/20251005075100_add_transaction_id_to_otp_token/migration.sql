/*
  Warnings:

  - A unique constraint covering the columns `[transactionId]` on the table `OtpToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `transactionId` to the `OtpToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."OtpToken" ADD COLUMN     "transactionId" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "OtpToken_transactionId_key" ON "public"."OtpToken"("transactionId");

-- CreateIndex
CREATE INDEX "OtpToken_transactionId_idx" ON "public"."OtpToken"("transactionId");
