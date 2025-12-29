-- Enable extension for UUID
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE "BadmintonBooking" ADD COLUMN IF NOT EXISTS "group_id" UUID;
-- Unique index để tránh duplicate booking
CREATE UNIQUE INDEX IF NOT EXISTS ux_booking_group_time
ON "BadmintonBooking"(group_id, time_start, time_end)
WHERE is_deleted = false;

-- Stored Procedure để auto tạo booking cho tuần kế tiếp
CREATE OR REPLACE FUNCTION auto_create_weekly_bookings()
RETURNS TABLE(
  total_processed INTEGER,
  total_created INTEGER,
  total_skipped INTEGER,
  total_errors INTEGER,
  log_messages TEXT[]
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_schedule RECORD;
  v_recurring_text TEXT;
  v_booking_start timestamptz;
  v_booking_end timestamptz;
  v_template_duration interval;
  v_new_id uuid;

  v_today date := (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
  v_next_start date := v_today + 7;
  v_next_end date := v_today + 13;

  v_processed INT := 0;
  v_created INT := 0;
  v_skipped INT := 0;
  v_errors INT := 0;
  v_logs TEXT[] := ARRAY[]::TEXT[];
  v_err TEXT;
BEGIN
  -- Advisory lock để tránh 2 process chạy cùng lúc
  PERFORM pg_try_advisory_lock(901234567);

  v_logs := array_append(v_logs, 'Start at: ' || v_today::TEXT);

  FOR v_schedule IN
    SELECT * FROM "BadmintonBooking"
    WHERE is_active = TRUE
      AND is_deleted = FALSE
      AND group_id IS NOT NULL
      AND coalesce(array_length(recurring_days, 1), 0) > 0
  LOOP
    v_processed := v_processed + 1;

    v_template_duration := v_schedule.time_end - v_schedule.time_start;

    FOREACH v_recurring_text IN ARRAY v_schedule.recurring_days
    LOOP
      BEGIN
        v_booking_start := v_recurring_text::timestamptz;

        IF v_booking_start::date BETWEEN v_next_start AND v_next_end THEN
          v_booking_end := v_booking_start + v_template_duration;

          BEGIN
            INSERT INTO "BadmintonBooking" (
              id,
              group_id, court_id, court_name, court_address,
              host_phone, host_name,
              time_start, time_end,
              price, price_man, price_woman,
              skill_levels, count,
              link_url, note,
              require_deposit, is_public,
              recurring_days,
              properties,
              created_by, updated_by,
              is_active, is_deleted,
              created_at, updated_at
            )
            VALUES (
              gen_random_uuid(),
              v_schedule.group_id, v_schedule.court_id, v_schedule.court_name, v_schedule.court_address,
              v_schedule.host_phone, v_schedule.host_name,
              v_booking_start, v_booking_end,
              v_schedule.price, v_schedule.price_man, v_schedule.price_woman,
              v_schedule.skill_levels, v_schedule.count,
              v_schedule.link_url, v_schedule.note,
              v_schedule.require_deposit, v_schedule.is_public,
              ARRAY[]::TEXT[],
              coalesce(v_schedule.properties,'{}'::jsonb)
                || jsonb_build_object(
                    'template_id', v_schedule.id,
                    'auto_created_by_cron', TRUE,
                    'original_recurring_date', v_recurring_text,
                    'cron_run_date', v_today::TEXT
                  ),
              v_schedule.created_by, v_schedule.created_by,
              TRUE, FALSE,
              NOW(), NOW()
            )
            RETURNING id INTO v_new_id;

            v_created := v_created + 1;
            v_logs := array_append(v_logs, 'CREATED booking ' || v_new_id || ' for ' || v_booking_start::text);
          EXCEPTION WHEN unique_violation THEN
            v_skipped := v_skipped + 1;
            v_logs := array_append(v_logs, 'SKIP duplicate at ' || v_booking_start::TEXT);
          END;
        END IF;

      EXCEPTION WHEN OTHERS THEN
        v_errors := v_errors + 1;
        GET STACKED DIAGNOSTICS v_err = MESSAGE_TEXT;
        v_logs := array_append(v_logs, 'ERROR date ' || v_recurring_text || ': ' || v_err);
      END;
    END LOOP;

  END LOOP;

  PERFORM pg_advisory_unlock(901234567);

  v_logs := array_append(v_logs,
    'Done: processed=' || v_processed ||
    ', created=' || v_created ||
    ', skipped=' || v_skipped ||
    ', errors=' || v_errors
  );

  RETURN QUERY SELECT v_processed, v_created, v_skipped, v_errors, v_logs;
END;
$$;

-- Grant permission
GRANT EXECUTE ON FUNCTION auto_create_weekly_bookings() TO PUBLIC;
