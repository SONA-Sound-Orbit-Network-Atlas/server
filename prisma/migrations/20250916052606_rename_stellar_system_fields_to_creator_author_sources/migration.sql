/*
  Warnings:

  - You are about to drop the column `created_by_id` on the `stellar_systems` table. All the data in the column will be lost.
  - You are about to drop the column `original_author_id` on the `stellar_systems` table. All the data in the column will be lost.
  - You are about to drop the column `owner_id` on the `stellar_systems` table. All the data in the column will be lost.
  - You are about to drop the column `source_system_id` on the `stellar_systems` table. All the data in the column will be lost.
  - Added the required column `author_id` to the `stellar_systems` table without a default value. This is not possible if the table is not empty.
  - Added the required column `creator_id` to the `stellar_systems` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."stellar_systems" DROP CONSTRAINT "stellar_systems_created_by_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."stellar_systems" DROP CONSTRAINT "stellar_systems_original_author_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."stellar_systems" DROP CONSTRAINT "stellar_systems_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."stellar_systems" DROP CONSTRAINT "stellar_systems_source_system_id_fkey";

-- DropIndex
DROP INDEX "public"."stellar_systems_created_by_id_idx";

-- DropIndex
DROP INDEX "public"."stellar_systems_owner_id_idx";

-- DropIndex
DROP INDEX "public"."stellar_systems_source_system_id_idx";

-- AlterTable
ALTER TABLE "public"."stellar_systems" DROP COLUMN "created_by_id",
DROP COLUMN "original_author_id",
DROP COLUMN "owner_id",
DROP COLUMN "source_system_id",
ADD COLUMN     "author_id" TEXT NOT NULL,
ADD COLUMN     "create_source_id" TEXT,
ADD COLUMN     "creator_id" TEXT NOT NULL,
ADD COLUMN     "original_source_id" TEXT;

-- CreateIndex
CREATE INDEX "stellar_systems_creator_id_idx" ON "public"."stellar_systems"("creator_id");

-- CreateIndex
CREATE INDEX "stellar_systems_author_id_idx" ON "public"."stellar_systems"("author_id");

-- CreateIndex
CREATE INDEX "stellar_systems_create_source_id_idx" ON "public"."stellar_systems"("create_source_id");

-- CreateIndex
CREATE INDEX "stellar_systems_original_source_id_idx" ON "public"."stellar_systems"("original_source_id");

-- AddForeignKey
ALTER TABLE "public"."stellar_systems" ADD CONSTRAINT "stellar_systems_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stellar_systems" ADD CONSTRAINT "stellar_systems_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stellar_systems" ADD CONSTRAINT "stellar_systems_create_source_id_fkey" FOREIGN KEY ("create_source_id") REFERENCES "public"."stellar_systems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stellar_systems" ADD CONSTRAINT "stellar_systems_original_source_id_fkey" FOREIGN KEY ("original_source_id") REFERENCES "public"."stellar_systems"("id") ON DELETE SET NULL ON UPDATE CASCADE;
