-- CreateTable
CREATE TABLE "public"."UserSystemConfig" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "notifyEmailInApp" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "properties" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSystemConfig_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE UNIQUE INDEX "UserSystemConfig_userId_key" ON "public"."UserSystemConfig"("userId");

-- CreateIndex
CREATE INDEX "UserSystemConfig_userId_idx" ON "public"."UserSystemConfig"("userId");

-- CreateIndex
CREATE INDEX "FailedQueueMessage_queueName_idx" ON "public"."FailedQueueMessage"("queueName");

-- CreateIndex
CREATE INDEX "FailedQueueMessage_messageType_idx" ON "public"."FailedQueueMessage"("messageType");

-- CreateIndex
CREATE INDEX "FailedQueueMessage_isResolved_idx" ON "public"."FailedQueueMessage"("isResolved");

-- CreateIndex
CREATE INDEX "FailedQueueMessage_failedAt_idx" ON "public"."FailedQueueMessage"("failedAt");
