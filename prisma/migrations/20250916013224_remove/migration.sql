/*
  Warnings:

  - You are about to drop the column `owner_id` on the `galaxies` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."galaxies" DROP CONSTRAINT "galaxies_owner_id_fkey";

-- DropIndex
DROP INDEX "public"."galaxies_owner_id_idx";

-- AlterTable
ALTER TABLE "public"."galaxies" DROP COLUMN "owner_id";
