-- CreateEnum
CREATE TYPE "public"."ReportOwnerStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "public"."TournamentStatus" AS ENUM ('PENDING_REGISTRATION', 'IN_PROCESS', 'COMPLETED', 'CANCELLED', 'DRAFT');

-- CreateEnum
CREATE TYPE "public"."GenderType" AS ENUM ('MALE', 'FEMALE', 'MIXED');

-- CreateEnum
CREATE TYPE "public"."MatchType" AS ENUM ('SINGLE', 'DOUBLE', 'TEAM');

-- CreateEnum
CREATE TYPE "public"."MatchStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('GENERAL', 'BOOKING', 'PAYMENT', 'SYSTEM', 'PROMOTION', 'REMINDER', 'WARNING', 'ERROR');

-- CreateEnum
CREATE TYPE "public"."SportType" AS ENUM ('BADMINTON', 'TENNIS', 'FOOTBALL', 'BASKETBALL', 'VOLLEYBALL', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."GroupMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MODERATOR', 'MEMBER');

-- CreateEnum
CREATE TYPE "public"."GroupMemberStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REMOVED', 'LEFT');

-- CreateEnum
CREATE TYPE "public"."PostStatus" AS ENUM ('ACTIVE', 'CLOSED', 'CANCELLED', 'ARCHIVED', 'PENDING');

-- CreateEnum
CREATE TYPE "public"."GroupPostType" AS ENUM ('RECRUITMENT', 'ANNOUNCEMENT', 'EVENT', 'DISCUSSION', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."GroupStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELED', 'REFUND_REQUEST', 'REFUNDED', 'REFUND_FAILED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."FeedbackType" AS ENUM ('CLASS', 'COURT', 'SCHEDULE', 'BOOKING', 'COACH');

-- CreateTable
CREATE TABLE "public"."BadmintonCourt" (
    "id" UUID NOT NULL,
    "court_name" TEXT NOT NULL,
    "court_address" TEXT,
    "court_phone" TEXT,
    "owner_name" TEXT,
    "name_normalized" TEXT,
    "longitude" DECIMAL(10,6),
    "latitude" DECIMAL(10,6),
    "price_casual" DECIMAL(12,2),
    "price_fixed" DECIMAL(12,2),
    "note" TEXT,
    "properties" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "district_id" UUID,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "BadmintonCourt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BadmintonBooking" (
    "court_id" UUID,
    "post_id" UUID,
    "group_id" UUID,
    "court_name" TEXT,
    "court_address" TEXT,
    "host_phone" TEXT,
    "host_name" TEXT,
    "note" TEXT,
    "properties" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "time_start" TIMESTAMP(3) NOT NULL,
    "time_end" TIMESTAMP(3) NOT NULL,
    "price" DECIMAL(12,2),
    "skill_levels" TEXT,
    "link_url" TEXT,
    "count" INTEGER,
    "price_man" DECIMAL(12,2),
    "price_woman" DECIMAL(12,2),
    "id" UUID NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "require_deposit" BOOLEAN NOT NULL DEFAULT false,
    "is_promotion" BOOLEAN NOT NULL DEFAULT false,
    "promotion_id" UUID,
    "insufficient_slots_notified_at" TIMESTAMP(3),
    "recurring_days" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "BadmintonBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BookingMember" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "is_payment" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "time_start" TIMESTAMP(3) NOT NULL,
    "time_end" TIMESTAMP(3) NOT NULL,
    "link_url" TEXT,
    "court_id" UUID,
    "post_id" UUID,
    "skill_levels" TEXT,
    "price" DECIMAL(12,2),
    "id_account" UUID,
    "id_booking" UUID NOT NULL,
    "resource_id" UUID,
    "created_by" UUID,
    "updated_by" UUID,
    "slot" INTEGER NOT NULL DEFAULT 1,
    "host_reported" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BookingMember_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "public"."Post" (
    "id" UUID NOT NULL,
    "author" TEXT,
    "content" TEXT,
    "raw_text" TEXT,
    "posted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "properties" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PointTransaction" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "booking_id" UUID,
    "point_change" INTEGER NOT NULL DEFAULT 10,
    "reason" TEXT,
    "bonus" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "properties" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "PointTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReportMatching" (
    "id" UUID NOT NULL,
    "reported_user_id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "booking_id" UUID,
    "note" TEXT,
    "properties" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "ReportMatching_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReportOwner" (
    "id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "booking_id" UUID,
    "court_id" UUID,
    "reason" TEXT,
    "note" TEXT,
    "properties" JSONB,
    "status" "public"."ReportOwnerStatus" NOT NULL DEFAULT 'PENDING',
    "rating" SMALLINT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "ReportOwner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Reservation" (
    "id" UUID NOT NULL,
    "court_id" UUID NOT NULL,
    "host_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Tournament" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "host_id" UUID NOT NULL,
    "court_id" UUID,
    "rules" TEXT,
    "link_url" TEXT,
    "properties" JSONB,
    "time_start" TIMESTAMP(3),
    "time_end" TIMESTAMP(3),
    "status" "public"."TournamentStatus" NOT NULL DEFAULT 'DRAFT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TournamentDetail" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "type" "public"."MatchType" NOT NULL,
    "gender_type" "public"."GenderType",
    "slot" INTEGER,
    "skill_level" TEXT,
    "rules" TEXT,
    "prizes" TEXT,
    "price" DECIMAL(12,2),
    "price_men" DECIMAL(12,2),
    "price_women" DECIMAL(12,2),
    "time_start" TIMESTAMP(3),
    "time_end" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "TournamentDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TournamentCategory" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."MatchType" NOT NULL,

    CONSTRAINT "TournamentCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TournamentTeam" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "tournament_detail_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "captain_id" UUID,
    "slots_member" JSONB NOT NULL,
    "members_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "TournamentTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TournamentMatch" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "tournament_detail_id" UUID NOT NULL,
    "court_id" UUID,
    "court_name" TEXT,
    "match_type" "public"."MatchType" NOT NULL,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "team_home_id" UUID NOT NULL,
    "team_guest_id" UUID NOT NULL,
    "winner_id" UUID,
    "status" "public"."MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Player" (
    "id" UUID NOT NULL,
    "tournament_id" UUID NOT NULL,
    "tournament_detail_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "team_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "public"."Group" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."GroupStatus" NOT NULL DEFAULT 'ACTIVE',
    "sport_type" "public"."SportType" NOT NULL DEFAULT 'BADMINTON',
    "skill_level" TEXT,
    "city_id" UUID,
    "city_name" TEXT,
    "district_id" UUID,
    "district_name" TEXT,
    "manager_id" UUID NOT NULL,
    "avatar_url" TEXT,
    "cover_image_url" TEXT,
    "member_count" INTEGER NOT NULL DEFAULT 0,
    "max_members" INTEGER,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "require_approval" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "properties" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GroupMember" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "public"."GroupMemberRole" NOT NULL DEFAULT 'MEMBER',
    "status" "public"."GroupMemberStatus" NOT NULL DEFAULT 'PENDING',
    "joined_at" TIMESTAMP(3),
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "rejected_by" UUID,
    "rejected_at" TIMESTAMP(3),
    "rejected_reason" TEXT,
    "note" TEXT,
    "properties" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GroupPost" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "media_ids" TEXT,
    "content" TEXT NOT NULL,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "share_count" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."PostStatus" NOT NULL DEFAULT 'PENDING',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "properties" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "GroupPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PostLike" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PostComment" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "parent_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PostShare" (
    "id" UUID NOT NULL,
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CourseSchedule" (
    "id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "court_id" UUID NOT NULL,
    "monday" BOOLEAN NOT NULL DEFAULT false,
    "tuesday" BOOLEAN NOT NULL DEFAULT false,
    "wednesday" BOOLEAN NOT NULL DEFAULT false,
    "thursday" BOOLEAN NOT NULL DEFAULT false,
    "friday" BOOLEAN NOT NULL DEFAULT false,
    "saturday" BOOLEAN NOT NULL DEFAULT false,
    "sunday" BOOLEAN NOT NULL DEFAULT false,
    "max_students" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "target_amount" INTEGER,
    "description" TEXT,
    "date_start" TIMESTAMP(3) NOT NULL,
    "date_end" TIMESTAMP(3) NOT NULL,
    "time_start" TIMESTAMP(3) NOT NULL,
    "time_end" TIMESTAMP(3) NOT NULL,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "CourseSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CourseClass" (
    "id" UUID NOT NULL,
    "channel_id" UUID NOT NULL,
    "class_name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "CourseClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CourseChannel" (
    "id" UUID NOT NULL,
    "coach_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "CourseChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CourseEnrollment" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "schedule_id" UUID NOT NULL,
    "note" TEXT,
    "is_payment" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "CourseEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CourseOrder" (
    "id" UUID NOT NULL,
    "enrollment_id" UUID NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "billing_date" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "CourseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Feedback" (
    "id" UUID NOT NULL,
    "target_id" UUID NOT NULL,
    "type" "public"."FeedbackType" NOT NULL,
    "comment" TEXT,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" TEXT,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BadmintonBooking_court_id_idx" ON "public"."BadmintonBooking"("court_id");

-- CreateIndex
CREATE INDEX "BadmintonBooking_post_id_idx" ON "public"."BadmintonBooking"("post_id");

-- CreateIndex
CREATE INDEX "BadmintonBooking_group_id_idx" ON "public"."BadmintonBooking"("group_id");

-- CreateIndex
CREATE INDEX "BadmintonBooking_created_by_idx" ON "public"."BadmintonBooking"("created_by");

-- CreateIndex
CREATE INDEX "BadmintonBooking_time_start_idx" ON "public"."BadmintonBooking"("time_start");

-- CreateIndex
CREATE INDEX "BadmintonBooking_time_end_idx" ON "public"."BadmintonBooking"("time_end");

-- CreateIndex
CREATE INDEX "BadmintonBooking_is_active_idx" ON "public"."BadmintonBooking"("is_active");

-- CreateIndex
CREATE INDEX "BadmintonBooking_is_deleted_idx" ON "public"."BadmintonBooking"("is_deleted");

-- CreateIndex
CREATE INDEX "BadmintonBooking_created_at_idx" ON "public"."BadmintonBooking"("created_at");

-- CreateIndex
CREATE INDEX "BadmintonBooking_promotion_id_idx" ON "public"."BadmintonBooking"("promotion_id");

-- CreateIndex
CREATE INDEX "BadmintonBooking_insufficient_slots_notified_at_idx" ON "public"."BadmintonBooking"("insufficient_slots_notified_at");

-- CreateIndex
CREATE INDEX "BookingMember_id_booking_idx" ON "public"."BookingMember"("id_booking");

-- CreateIndex
CREATE INDEX "BookingMember_court_id_idx" ON "public"."BookingMember"("court_id");

-- CreateIndex
CREATE INDEX "BookingMember_post_id_idx" ON "public"."BookingMember"("post_id");

-- CreateIndex
CREATE INDEX "BookingMember_id_account_idx" ON "public"."BookingMember"("id_account");

-- CreateIndex
CREATE INDEX "BookingMember_created_by_idx" ON "public"."BookingMember"("created_by");

-- CreateIndex
CREATE INDEX "BookingMember_time_start_idx" ON "public"."BookingMember"("time_start");

-- CreateIndex
CREATE INDEX "BookingMember_time_end_idx" ON "public"."BookingMember"("time_end");

-- CreateIndex
CREATE INDEX "BookingMember_is_payment_idx" ON "public"."BookingMember"("is_payment");

-- CreateIndex
CREATE INDEX "BookingMember_is_active_idx" ON "public"."BookingMember"("is_active");

-- CreateIndex
CREATE INDEX "BookingMember_is_deleted_idx" ON "public"."BookingMember"("is_deleted");

-- CreateIndex
CREATE INDEX "BookingMember_created_at_idx" ON "public"."BookingMember"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "PointTransaction_user_id_booking_id_key" ON "public"."PointTransaction"("user_id", "booking_id");

-- CreateIndex
CREATE INDEX "Reservation_court_id_idx" ON "public"."Reservation"("court_id");

-- CreateIndex
CREATE INDEX "Reservation_host_id_idx" ON "public"."Reservation"("host_id");

-- CreateIndex
CREATE INDEX "Reservation_user_id_idx" ON "public"."Reservation"("user_id");

-- CreateIndex
CREATE INDEX "Reservation_created_at_idx" ON "public"."Reservation"("created_at");

-- CreateIndex
CREATE INDEX "Reservation_is_active_idx" ON "public"."Reservation"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentCategory_name_key" ON "public"."TournamentCategory"("name");

-- CreateIndex
CREATE INDEX "TournamentTeam_tournament_detail_id_idx" ON "public"."TournamentTeam"("tournament_detail_id");

-- CreateIndex
CREATE INDEX "TournamentTeam_captain_id_idx" ON "public"."TournamentTeam"("captain_id");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentTeam_tournament_id_tournament_detail_id_name_key" ON "public"."TournamentTeam"("tournament_id", "tournament_detail_id", "name");

-- CreateIndex
CREATE INDEX "TournamentMatch_tournament_id_idx" ON "public"."TournamentMatch"("tournament_id");

-- CreateIndex
CREATE INDEX "TournamentMatch_status_idx" ON "public"."TournamentMatch"("status");

-- CreateIndex
CREATE INDEX "TournamentMatch_match_type_idx" ON "public"."TournamentMatch"("match_type");

-- CreateIndex
CREATE INDEX "Player_user_id_idx" ON "public"."Player"("user_id");

-- CreateIndex
CREATE INDEX "Player_team_id_idx" ON "public"."Player"("team_id");

-- CreateIndex
CREATE INDEX "Player_tournament_detail_id_idx" ON "public"."Player"("tournament_detail_id");

-- CreateIndex
CREATE UNIQUE INDEX "Player_tournament_id_tournament_detail_id_user_id_key" ON "public"."Player"("tournament_id", "tournament_detail_id", "user_id");

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

-- CreateIndex
CREATE INDEX "Group_manager_id_idx" ON "public"."Group"("manager_id");

-- CreateIndex
CREATE INDEX "Group_status_idx" ON "public"."Group"("status");

-- CreateIndex
CREATE INDEX "Group_sport_type_idx" ON "public"."Group"("sport_type");

-- CreateIndex
CREATE INDEX "Group_city_id_idx" ON "public"."Group"("city_id");

-- CreateIndex
CREATE INDEX "Group_district_id_idx" ON "public"."Group"("district_id");

-- CreateIndex
CREATE INDEX "Group_is_active_idx" ON "public"."Group"("is_active");

-- CreateIndex
CREATE INDEX "Group_created_at_idx" ON "public"."Group"("created_at");

-- CreateIndex
CREATE INDEX "GroupMember_group_id_idx" ON "public"."GroupMember"("group_id");

-- CreateIndex
CREATE INDEX "GroupMember_user_id_idx" ON "public"."GroupMember"("user_id");

-- CreateIndex
CREATE INDEX "GroupMember_status_idx" ON "public"."GroupMember"("status");

-- CreateIndex
CREATE INDEX "GroupMember_role_idx" ON "public"."GroupMember"("role");

-- CreateIndex
CREATE INDEX "GroupMember_created_at_idx" ON "public"."GroupMember"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_group_id_user_id_key" ON "public"."GroupMember"("group_id", "user_id");

-- CreateIndex
CREATE INDEX "GroupPost_group_id_idx" ON "public"."GroupPost"("group_id");

-- CreateIndex
CREATE INDEX "GroupPost_author_id_idx" ON "public"."GroupPost"("author_id");

-- CreateIndex
CREATE INDEX "GroupPost_created_at_idx" ON "public"."GroupPost"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "PostLike_post_id_user_id_key" ON "public"."PostLike"("post_id", "user_id");

-- CreateIndex
CREATE INDEX "PostComment_post_id_idx" ON "public"."PostComment"("post_id");

-- AddForeignKey
ALTER TABLE "public"."BadmintonBooking" ADD CONSTRAINT "BadmintonBooking_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "public"."BadmintonCourt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BadmintonBooking" ADD CONSTRAINT "BadmintonBooking_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BadmintonBooking" ADD CONSTRAINT "BadmintonBooking_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BadmintonBooking" ADD CONSTRAINT "BadmintonBooking_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "public"."Promotion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingMember" ADD CONSTRAINT "BookingMember_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "public"."BadmintonCourt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingMember" ADD CONSTRAINT "BookingMember_id_booking_fkey" FOREIGN KEY ("id_booking") REFERENCES "public"."BadmintonBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BookingMember" ADD CONSTRAINT "BookingMember_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PointTransaction" ADD CONSTRAINT "PointTransaction_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."BadmintonBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportMatching" ADD CONSTRAINT "ReportMatching_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."BadmintonBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportOwner" ADD CONSTRAINT "ReportOwner_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "public"."BadmintonCourt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReportOwner" ADD CONSTRAINT "ReportOwner_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."BadmintonBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "public"."BadmintonCourt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tournament" ADD CONSTRAINT "Tournament_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "public"."BadmintonCourt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentDetail" ADD CONSTRAINT "TournamentDetail_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."TournamentCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentDetail" ADD CONSTRAINT "TournamentDetail_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentTeam" ADD CONSTRAINT "TournamentTeam_tournament_detail_id_fkey" FOREIGN KEY ("tournament_detail_id") REFERENCES "public"."TournamentDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentTeam" ADD CONSTRAINT "TournamentTeam_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentMatch" ADD CONSTRAINT "TournamentMatch_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "public"."BadmintonCourt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentMatch" ADD CONSTRAINT "TournamentMatch_team_guest_id_fkey" FOREIGN KEY ("team_guest_id") REFERENCES "public"."TournamentTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentMatch" ADD CONSTRAINT "TournamentMatch_team_home_id_fkey" FOREIGN KEY ("team_home_id") REFERENCES "public"."TournamentTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentMatch" ADD CONSTRAINT "TournamentMatch_tournament_detail_id_fkey" FOREIGN KEY ("tournament_detail_id") REFERENCES "public"."TournamentDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentMatch" ADD CONSTRAINT "TournamentMatch_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TournamentMatch" ADD CONSTRAINT "TournamentMatch_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "public"."TournamentTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Player" ADD CONSTRAINT "Player_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."TournamentTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Player" ADD CONSTRAINT "Player_tournament_detail_id_fkey" FOREIGN KEY ("tournament_detail_id") REFERENCES "public"."TournamentDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Player" ADD CONSTRAINT "Player_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "public"."Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NotificationDetail" ADD CONSTRAINT "NotificationDetail_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "public"."Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupMember" ADD CONSTRAINT "GroupMember_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupPost" ADD CONSTRAINT "GroupPost_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostLike" ADD CONSTRAINT "PostLike_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."GroupPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostComment" ADD CONSTRAINT "PostComment_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."GroupPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostComment" ADD CONSTRAINT "PostComment_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."PostComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PostShare" ADD CONSTRAINT "PostShare_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."GroupPost"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseSchedule" ADD CONSTRAINT "CourseSchedule_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "public"."CourseClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseSchedule" ADD CONSTRAINT "CourseSchedule_court_id_fkey" FOREIGN KEY ("court_id") REFERENCES "public"."BadmintonCourt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseClass" ADD CONSTRAINT "CourseClass_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."CourseChannel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."CourseSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CourseOrder" ADD CONSTRAINT "CourseOrder_enrollment_id_fkey" FOREIGN KEY ("enrollment_id") REFERENCES "public"."CourseEnrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Feedback" ADD CONSTRAINT "Feedback_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "public"."CourseSchedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
