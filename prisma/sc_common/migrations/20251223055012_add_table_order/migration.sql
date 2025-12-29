-- CreateTable
CREATE TABLE "public"."ErrorLog" (
    "id" UUID NOT NULL,
    "service_name" TEXT,
    "error_message" TEXT NOT NULL,
    "error_stack" TEXT,
    "error_code" TEXT,
    "severity" TEXT,
    "context" JSONB,
    "note" TEXT,
    "properties" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "ErrorLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FailedQueueMessage" (
    "id" UUID NOT NULL,
    "queueName" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "messageData" JSONB NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "errorStack" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastRetryAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FailedQueueMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BehaviorUser" (
    "id" UUID NOT NULL,
    "user_ip" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "search_params" JSONB,
    "user_agent" TEXT,
    "referrer" TEXT,
    "session_id" TEXT,
    "note" TEXT,
    "properties" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "BehaviorUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."District" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "longitude" DECIMAL(10,6),
    "latitude" DECIMAL(10,6),
    "note" TEXT,
    "properties" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name_normalized" TEXT,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Geography" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "division_type" TEXT,
    "codename" TEXT,
    "phone_code" INTEGER,
    "note" TEXT,
    "properties" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "Geography_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE INDEX "FailedQueueMessage_queueName_idx" ON "public"."FailedQueueMessage"("queueName");

-- CreateIndex
CREATE INDEX "FailedQueueMessage_messageType_idx" ON "public"."FailedQueueMessage"("messageType");

-- CreateIndex
CREATE INDEX "FailedQueueMessage_isResolved_idx" ON "public"."FailedQueueMessage"("isResolved");

-- CreateIndex
CREATE INDEX "FailedQueueMessage_failedAt_idx" ON "public"."FailedQueueMessage"("failedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Geography_code_key" ON "public"."Geography"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Geography_codename_key" ON "public"."Geography"("codename");

-- CreateIndex
CREATE INDEX "Geography_code_idx" ON "public"."Geography"("code");

-- CreateIndex
CREATE INDEX "Geography_codename_idx" ON "public"."Geography"("codename");

-- CreateIndex
CREATE INDEX "Geography_is_active_idx" ON "public"."Geography"("is_active");

-- CreateIndex
CREATE INDEX "Bank_code_idx" ON "public"."Bank"("code");

-- CreateIndex
CREATE INDEX "Bank_bin_idx" ON "public"."Bank"("bin");
