-- CreateEnum
CREATE TYPE "MediaFileCategory" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "MediaFileActionType" AS ENUM ('UPLOAD', 'DOWNLOAD');

-- CreateTable
CREATE TABLE "MediaFile" (
    "userId" UUID,
    "id" UUID NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT,
    "mimeType" TEXT,
    "sizeInBytes" BIGINT,
    "storagePath" TEXT,
    "url" TEXT,
    "checksum" TEXT,
    "category" "MediaFileCategory" NOT NULL DEFAULT 'IMAGE',
    "actionType" "MediaFileActionType" NOT NULL DEFAULT 'UPLOAD',
    "description" TEXT,
    "properties" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "hlsPlaylistPath" TEXT,
    "hlsSegmentsFolder" TEXT,
    "hlsProcessingStatus" TEXT DEFAULT 'PENDING',
    "hlsResolutions" TEXT,
    "hlsDuration" INTEGER,
    "hlsError" TEXT,

    CONSTRAINT "MediaFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RealtimeMessage" (
    "id" UUID NOT NULL,
    "room" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'chat',
    "senderId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RealtimeMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MediaFile_userId_idx" ON "MediaFile"("userId");

-- CreateIndex
CREATE INDEX "RealtimeMessage_id_idx" ON "RealtimeMessage"("id");

-- CreateIndex
CREATE INDEX "RealtimeMessage_room_idx" ON "RealtimeMessage"("room");

-- CreateIndex
CREATE INDEX "RealtimeMessage_senderId_idx" ON "RealtimeMessage"("senderId");
