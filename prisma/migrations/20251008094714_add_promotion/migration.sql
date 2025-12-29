-- AlterTable
ALTER TABLE "public"."BadmintonBooking" ADD COLUMN     "is_promotion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "promotion_id" UUID;

-- CreateTable
CREATE TABLE "public"."Promotion" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."BadmintonBooking" ADD CONSTRAINT "BadmintonBooking_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "public"."Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
