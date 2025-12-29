-- -- 1️⃣ Thêm cột mới roles
-- ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "roles" "UserRole"[] DEFAULT ARRAY['user']::"UserRole"[];

-- -- 2️⃣ Copy giá trị role cũ sang roles mới
-- UPDATE "User" SET "roles" = ARRAY["role"];

-- -- 3️⃣ Xóa cột role cũ
-- ALTER TABLE "User" DROP COLUMN IF EXISTS "role";
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "roles" "UserRole"[] DEFAULT ARRAY['user']::"UserRole"[];
