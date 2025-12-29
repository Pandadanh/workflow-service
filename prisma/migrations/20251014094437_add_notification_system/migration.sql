-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('GENERAL', 'BOOKING', 'PAYMENT', 'SYSTEM', 'PROMOTION', 'REMINDER', 'WARNING', 'ERROR');

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL DEFAULT 'GENERAL',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "resourceId" UUID,
    "resourceType" TEXT,
    "actionUrl" TEXT,
    "metadata" JSONB,
    "note" TEXT,
    "properties" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NotificationDetail" (
    "id" UUID NOT NULL,
    "notificationId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'text',
    "imageUrl" TEXT,
    "actionLabel" TEXT,
    "actionUrl" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "note" TEXT,
    "properties" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" UUID,
    "updatedBy" UUID,

    CONSTRAINT "NotificationDetail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "public"."Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "public"."Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "public"."Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "public"."Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_resourceId_idx" ON "public"."Notification"("resourceId");

-- CreateIndex
CREATE INDEX "Notification_resourceType_idx" ON "public"."Notification"("resourceType");

-- CreateIndex
CREATE INDEX "NotificationDetail_notificationId_idx" ON "public"."NotificationDetail"("notificationId");

-- CreateIndex
CREATE INDEX "NotificationDetail_priority_idx" ON "public"."NotificationDetail"("priority");

-- CreateIndex
CREATE INDEX "NotificationDetail_createdAt_idx" ON "public"."NotificationDetail"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationDetail" ADD CONSTRAINT "NotificationDetail_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "public"."Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
