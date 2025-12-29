-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."OrderStatus" ADD VALUE 'REFUND_REQUEST';
ALTER TYPE "public"."OrderStatus" ADD VALUE 'REFUNDED';
ALTER TYPE "public"."OrderStatus" ADD VALUE 'REFUND_FAILED';

-- CreateTable
CREATE TABLE "public"."RefundTransaction" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "transId" BIGINT NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "description" TEXT,
    "resultCode" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "responseTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefundTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RefundTransaction_orderId_idx" ON "public"."RefundTransaction"("orderId");
