-- DropForeignKey
ALTER TABLE "RatingHistory" DROP CONSTRAINT "RatingHistory_user_id_fkey";

-- AlterTable
ALTER TABLE "RatingHistory" ALTER COLUMN "id" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "RatingHistory" ADD CONSTRAINT "RatingHistory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "UserRank"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
