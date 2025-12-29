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
