-- Rename columns in UserSystemConfig table to match schema
-- This preserves existing data instead of dropping and recreating columns

-- Rename created_at to createdAt
ALTER TABLE "public"."UserSystemConfig" RENAME COLUMN "created_at" TO "createdAt";

-- Rename updated_at to updatedAt  
ALTER TABLE "public"."UserSystemConfig" RENAME COLUMN "updated_at" TO "updatedAt";

-- Rename is_active to isActive
ALTER TABLE "public"."UserSystemConfig" RENAME COLUMN "is_active" TO "isActive";

-- Rename is_deleted to isDeleted
ALTER TABLE "public"."UserSystemConfig" RENAME COLUMN "is_deleted" TO "isDeleted";

-- Add missing columns that are in the schema but not in the database
ALTER TABLE "public"."UserSystemConfig" ADD COLUMN "createdBy" UUID;
ALTER TABLE "public"."UserSystemConfig" ADD COLUMN "updatedBy" UUID;
