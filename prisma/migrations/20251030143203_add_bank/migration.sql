/*
  Warnings:

  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('user', 'host', 'admin');

-- DropIndex
DROP INDEX "public"."User_role_idx";

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "role",
ADD COLUMN     "roles" "public"."UserRole"[] DEFAULT ARRAY['user']::"public"."UserRole"[];

-- CreateTable
CREATE TABLE "public"."Reservation" (
    "id" UUID NOT NULL,
    "court_id" UUID NOT NULL,
    "host_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "is_notification" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Bank" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" VARCHAR(20),
    "bin" VARCHAR(20),
    "shortName" VARCHAR(100),
    "short_name" VARCHAR(100),
    "logo" TEXT,
    "transferSupported" INTEGER DEFAULT 0,
    "lookupSupported" INTEGER DEFAULT 0,
    "support" INTEGER DEFAULT 0,
    "isTransfer" INTEGER DEFAULT 0,
    "swift_code" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserBankAccount" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "bankId" INTEGER,
    "bankCode" VARCHAR(20),
    "bankBin" VARCHAR(20),
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "note" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reservation_court_id_idx" ON "public"."Reservation"("court_id");

-- CreateIndex
CREATE INDEX "Reservation_host_id_idx" ON "public"."Reservation"("host_id");

-- CreateIndex
CREATE INDEX "Reservation_user_id_idx" ON "public"."Reservation"("user_id");

-- CreateIndex
CREATE INDEX "Reservation_created_at_idx" ON "public"."Reservation"("created_at");

-- CreateIndex
CREATE INDEX "Reservation_is_active_idx" ON "public"."Reservation"("is_active");

-- CreateIndex
CREATE INDEX "Bank_code_idx" ON "public"."Bank"("code");

-- CreateIndex
CREATE INDEX "Bank_bin_idx" ON "public"."Bank"("bin");

-- CreateIndex
CREATE INDEX "UserBankAccount_userId_idx" ON "public"."UserBankAccount"("userId");

-- CreateIndex
CREATE INDEX "UserBankAccount_accountNumber_idx" ON "public"."UserBankAccount"("accountNumber");

-- CreateIndex
CREATE INDEX "User_roles_idx" ON "public"."User"("roles");

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "public"."BadmintonCourt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBankAccount" ADD CONSTRAINT "UserBankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
