/*
  Warnings:

  - You are about to drop the column `instrument_type` on the `planets` table. All the data in the column will be lost.
  - You are about to drop the column `orbit_a` on the `planets` table. All the data in the column will be lost.
  - You are about to drop the column `orbit_angular_speed` on the `planets` table. All the data in the column will be lost.
  - You are about to drop the column `orbit_b` on the `planets` table. All the data in the column will be lost.
  - You are about to drop the column `orbit_inclination_deg` on the `planets` table. All the data in the column will be lost.
  - You are about to drop the column `orbit_phase0` on the `planets` table. All the data in the column will be lost.
  - You are about to drop the column `orbit_radius` on the `planets` table. All the data in the column will be lost.
  - You are about to drop the column `orbit_rotation_deg` on the `planets` table. All the data in the column will be lost.
  - You are about to drop the column `orbit_type` on the `planets` table. All the data in the column will be lost.
  - You are about to drop the column `params` on the `planets` table. All the data in the column will be lost.
  - You are about to drop the column `bpm` on the `stellar_systems` table. All the data in the column will be lost.
  - You are about to drop the column `x` on the `stellar_systems` table. All the data in the column will be lost.
  - You are about to drop the column `y` on the `stellar_systems` table. All the data in the column will be lost.
  - You are about to drop the column `z` on the `stellar_systems` table. All the data in the column will be lost.
  - You are about to drop the `patterns` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `created_by_id` to the `stellar_systems` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."CreationMethod" AS ENUM ('MANUAL', 'CLONE');

-- DropForeignKey
ALTER TABLE "public"."patterns" DROP CONSTRAINT "patterns_planet_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."patterns" DROP CONSTRAINT "patterns_source_pattern_id_fkey";

-- AlterTable
ALTER TABLE "public"."planets" DROP COLUMN "instrument_type",
DROP COLUMN "orbit_a",
DROP COLUMN "orbit_angular_speed",
DROP COLUMN "orbit_b",
DROP COLUMN "orbit_inclination_deg",
DROP COLUMN "orbit_phase0",
DROP COLUMN "orbit_radius",
DROP COLUMN "orbit_rotation_deg",
DROP COLUMN "orbit_type",
DROP COLUMN "params",
ADD COLUMN     "audio_properties" JSONB DEFAULT '{}',
ADD COLUMN     "instrument_role" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "planet_type" TEXT NOT NULL DEFAULT 'PLANET';

-- AlterTable
ALTER TABLE "public"."stellar_systems" DROP COLUMN "bpm",
DROP COLUMN "x",
DROP COLUMN "y",
DROP COLUMN "z",
ADD COLUMN     "created_by_id" TEXT NOT NULL,
ADD COLUMN     "created_via" "public"."CreationMethod" NOT NULL DEFAULT 'MANUAL';

-- DropTable
DROP TABLE "public"."patterns";

-- CreateTable
CREATE TABLE "public"."options" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "options_code_key" ON "public"."options"("code");

-- CreateIndex
CREATE INDEX "galaxies_owner_id_idx" ON "public"."galaxies"("owner_id");

-- CreateIndex
CREATE INDEX "likes_user_id_idx" ON "public"."likes"("user_id");

-- CreateIndex
CREATE INDEX "likes_system_id_idx" ON "public"."likes"("system_id");

-- CreateIndex
CREATE INDEX "planets_system_id_idx" ON "public"."planets"("system_id");

-- CreateIndex
CREATE INDEX "planets_instrument_role_idx" ON "public"."planets"("instrument_role");

-- CreateIndex
CREATE INDEX "stellar_systems_galaxy_id_idx" ON "public"."stellar_systems"("galaxy_id");

-- CreateIndex
CREATE INDEX "stellar_systems_owner_id_idx" ON "public"."stellar_systems"("owner_id");

-- CreateIndex
CREATE INDEX "stellar_systems_created_by_id_idx" ON "public"."stellar_systems"("created_by_id");

-- CreateIndex
CREATE INDEX "stellar_systems_source_system_id_idx" ON "public"."stellar_systems"("source_system_id");

-- AddForeignKey
ALTER TABLE "public"."stellar_systems" ADD CONSTRAINT "stellar_systems_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
