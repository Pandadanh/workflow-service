-- CreateEnum
CREATE TYPE "public"."MediaFileCategory" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."MediaFileActionType" AS ENUM ('UPLOAD', 'DOWNLOAD');

-- CreateTable
CREATE TABLE "public"."MediaFile" (
    "userId" UUID,
    "id" UUID NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT,
    "mimeType" TEXT,
    "sizeInBytes" BIGINT,
    "storagePath" TEXT,
    "url" TEXT,
    "checksum" TEXT,
    "category" "public"."MediaFileCategory" NOT NULL DEFAULT 'IMAGE',
    "actionType" "public"."MediaFileActionType" NOT NULL DEFAULT 'UPLOAD',
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

-- CreateIndex
CREATE INDEX "MediaFile_userId_idx" ON "public"."MediaFile"("userId");
