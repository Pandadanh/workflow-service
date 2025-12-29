-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('user', 'host', 'admin', 'coaching');

-- CreateEnum
CREATE TYPE "public"."TokenType" AS ENUM ('EMAIL_OTP', 'EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "roles" "public"."UserRole"[] DEFAULT ARRAY['user']::"public"."UserRole"[],
    "note" TEXT,
    "properties" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserProfile" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "phone_number" TEXT,
    "email" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "gender" TEXT,
    "avatar_url" TEXT,
    "bio" TEXT,
    "address" TEXT,
    "social_links" JSONB,
    "properties" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OtpToken" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" "public"."TokenType" NOT NULL DEFAULT 'EMAIL_OTP',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "transactionId" UUID NOT NULL,

    CONSTRAINT "OtpToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" "public"."TokenType" NOT NULL DEFAULT 'EMAIL_VERIFICATION',
    "userId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserFavorite" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "courtId" UUID,
    "courtName" TEXT,
    "courtAddress" TEXT,
    "districtId" UUID,
    "districtName" TEXT,
    "skillLevel" TEXT,
    "note" TEXT,
    "properties" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,

    CONSTRAINT "UserFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RankLevel" (
    "id" UUID NOT NULL,
    "rank_name" TEXT NOT NULL,
    "note" TEXT,
    "properties" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,
    "next_level_id" UUID,

    CONSTRAINT "RankLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserRank" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "current_point" INTEGER NOT NULL DEFAULT 0,
    "rank_id" UUID,
    "note" TEXT,
    "properties" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "UserRank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserSystemConfig" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "notifyEmailInApp" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "properties" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,

    CONSTRAINT "UserSystemConfig_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "public"."UserWallet" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "balance" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "frozenBalance" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,

    CONSTRAINT "UserWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Transaction" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "expired_at" TIMESTAMP(3),
    "ip_address" TEXT,
    "user_agent" TEXT,
    "note" TEXT,
    "properties" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "public"."User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "public"."User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "User_roles_idx" ON "public"."User"("roles");

-- CreateIndex
CREATE INDEX "User_created_at_idx" ON "public"."User"("created_at");

-- CreateIndex
CREATE INDEX "User_is_active_idx" ON "public"."User"("is_active");

-- CreateIndex
CREATE INDEX "User_is_deleted_idx" ON "public"."User"("is_deleted");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_user_id_key" ON "public"."UserProfile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_email_key" ON "public"."UserProfile"("email");

-- CreateIndex
CREATE INDEX "UserProfile_user_id_idx" ON "public"."UserProfile"("user_id");

-- CreateIndex
CREATE INDEX "UserProfile_phone_number_idx" ON "public"."UserProfile"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "OtpToken_transactionId_key" ON "public"."OtpToken"("transactionId");

-- CreateIndex
CREATE INDEX "OtpToken_email_idx" ON "public"."OtpToken"("email");

-- CreateIndex
CREATE INDEX "OtpToken_token_idx" ON "public"."OtpToken"("token");

-- CreateIndex
CREATE INDEX "OtpToken_expiresAt_idx" ON "public"."OtpToken"("expiresAt");

-- CreateIndex
CREATE INDEX "OtpToken_transactionId_idx" ON "public"."OtpToken"("transactionId");

-- CreateIndex
CREATE INDEX "VerificationToken_email_idx" ON "public"."VerificationToken"("email");

-- CreateIndex
CREATE INDEX "VerificationToken_token_idx" ON "public"."VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "UserFavorite_userId_key" ON "public"."UserFavorite"("userId");

-- CreateIndex
CREATE INDEX "RankLevel_next_level_id_idx" ON "public"."RankLevel"("next_level_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserRank_user_id_key" ON "public"."UserRank"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserSystemConfig_userId_key" ON "public"."UserSystemConfig"("userId");

-- CreateIndex
CREATE INDEX "UserSystemConfig_userId_idx" ON "public"."UserSystemConfig"("userId");

-- CreateIndex
CREATE INDEX "UserBankAccount_userId_idx" ON "public"."UserBankAccount"("userId");

-- CreateIndex
CREATE INDEX "UserBankAccount_accountNumber_idx" ON "public"."UserBankAccount"("accountNumber");

-- CreateIndex
CREATE UNIQUE INDEX "UserWallet_userId_key" ON "public"."UserWallet"("userId");

-- CreateIndex
CREATE INDEX "UserWallet_userId_idx" ON "public"."UserWallet"("userId");

-- CreateIndex
CREATE INDEX "UserWallet_balance_idx" ON "public"."UserWallet"("balance");

-- CreateIndex
CREATE INDEX "Transaction_user_id_idx" ON "public"."Transaction"("user_id");

-- AddForeignKey
ALTER TABLE "public"."UserProfile" ADD CONSTRAINT "UserProfile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RankLevel" ADD CONSTRAINT "RankLevel_next_level_id_fkey" FOREIGN KEY ("next_level_id") REFERENCES "public"."RankLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserRank" ADD CONSTRAINT "UserRank_rank_id_fkey" FOREIGN KEY ("rank_id") REFERENCES "public"."RankLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserRank" ADD CONSTRAINT "UserRank_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserBankAccount" ADD CONSTRAINT "UserBankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserWallet" ADD CONSTRAINT "UserWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
