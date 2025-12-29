-- Fix drift: Sync database schema with Prisma schema
-- This migration ensures the database matches the current Prisma schema

-- Add insufficient_slots_notified_at column to BadmintonBooking if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'BadmintonBooking' 
        AND column_name = 'insufficient_slots_notified_at'
    ) THEN
        ALTER TABLE "public"."BadmintonBooking" 
        ADD COLUMN "insufficient_slots_notified_at" TIMESTAMP(3);
    END IF;
END $$;

-- Add index for insufficient_slots_notified_at if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'BadmintonBooking' 
        AND indexname = 'BadmintonBooking_insufficient_slots_notified_at_idx'
    ) THEN
        CREATE INDEX "BadmintonBooking_insufficient_slots_notified_at_idx" 
        ON "public"."BadmintonBooking"("insufficient_slots_notified_at");
    END IF;
END $$;

-- Remove is_notification column from Reservation if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'Reservation' 
        AND column_name = 'is_notification'
    ) THEN
        ALTER TABLE "public"."Reservation" 
        DROP COLUMN "is_notification";
    END IF;
END $$;

