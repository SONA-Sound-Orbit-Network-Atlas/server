/*
  Warnings:

  - Made the column `create_source_id` on table `stellar_systems` required. This step will fail if there are existing NULL values in that column.
  - Made the column `original_source_id` on table `stellar_systems` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."stellar_systems" DROP CONSTRAINT "stellar_systems_create_source_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."stellar_systems" DROP CONSTRAINT "stellar_systems_original_source_id_fkey";

-- AlterTable
ALTER TABLE "public"."stellar_systems" ALTER COLUMN "create_source_id" SET NOT NULL,
ALTER COLUMN "original_source_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."stellar_systems" ADD CONSTRAINT "stellar_systems_create_source_id_fkey" FOREIGN KEY ("create_source_id") REFERENCES "public"."stellar_systems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stellar_systems" ADD CONSTRAINT "stellar_systems_original_source_id_fkey" FOREIGN KEY ("original_source_id") REFERENCES "public"."stellar_systems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
