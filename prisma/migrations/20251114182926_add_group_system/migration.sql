-- CreateEnum
CREATE TYPE "public"."GroupStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."SportType" AS ENUM ('BADMINTON', 'TENNIS', 'FOOTBALL', 'BASKETBALL', 'VOLLEYBALL', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."GroupMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MODERATOR', 'MEMBER');

-- CreateEnum
CREATE TYPE "public"."GroupMemberStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REMOVED', 'LEFT');

-- CreateEnum
CREATE TYPE "public"."GroupPostType" AS ENUM ('RECRUITMENT', 'ANNOUNCEMENT', 'EVENT', 'DISCUSSION', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."PostStatus" AS ENUM ('ACTIVE', 'CLOSED', 'CANCELLED', 'ARCHIVED');

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
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "post_type" "public"."GroupPostType" NOT NULL DEFAULT 'RECRUITMENT',
    "skill_level" TEXT,
    "slots_needed" INTEGER,
    "slots_filled" INTEGER NOT NULL DEFAULT 0,
    "time_start" TIMESTAMP(3),
    "time_end" TIMESTAMP(3),
    "location" TEXT,
    "status" "public"."PostStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "properties" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "GroupPost_pkey" PRIMARY KEY ("id")
);

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
CREATE INDEX "GroupPost_post_type_idx" ON "public"."GroupPost"("post_type");

-- CreateIndex
CREATE INDEX "GroupPost_status_idx" ON "public"."GroupPost"("status");

-- CreateIndex
CREATE INDEX "GroupPost_created_at_idx" ON "public"."GroupPost"("created_at");

-- CreateIndex
CREATE INDEX "GroupPost_is_pinned_idx" ON "public"."GroupPost"("is_pinned");

-- AddForeignKey
ALTER TABLE "public"."Group" ADD CONSTRAINT "Group_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupMember" ADD CONSTRAINT "GroupMember_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupMember" ADD CONSTRAINT "GroupMember_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupPost" ADD CONSTRAINT "GroupPost_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GroupPost" ADD CONSTRAINT "GroupPost_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
