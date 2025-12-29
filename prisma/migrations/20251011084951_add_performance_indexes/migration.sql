-- CreateIndex
CREATE INDEX "BadmintonBooking_court_id_idx" ON "public"."BadmintonBooking"("court_id");

-- CreateIndex
CREATE INDEX "BadmintonBooking_post_id_idx" ON "public"."BadmintonBooking"("post_id");

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
CREATE INDEX "User_is_active_idx" ON "public"."User"("is_active");

-- CreateIndex
CREATE INDEX "User_is_deleted_idx" ON "public"."User"("is_deleted");
