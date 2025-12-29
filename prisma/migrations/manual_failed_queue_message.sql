-- CreateTable
CREATE TABLE "FailedQueueMessage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FailedQueueMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FailedQueueMessage_queueName_idx" ON "FailedQueueMessage"("queueName");

-- CreateIndex
CREATE INDEX "FailedQueueMessage_messageType_idx" ON "FailedQueueMessage"("messageType");

-- CreateIndex
CREATE INDEX "FailedQueueMessage_isResolved_idx" ON "FailedQueueMessage"("isResolved");

-- CreateIndex
CREATE INDEX "FailedQueueMessage_failedAt_idx" ON "FailedQueueMessage"("failedAt");
