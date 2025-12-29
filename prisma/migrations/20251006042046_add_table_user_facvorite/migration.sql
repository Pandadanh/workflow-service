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

-- CreateIndex
CREATE UNIQUE INDEX "UserFavorite_userId_key" ON "public"."UserFavorite"("userId");
