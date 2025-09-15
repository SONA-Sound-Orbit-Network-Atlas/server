/*
  Warnings:

  - You are about to drop the column `planet_type` on the `planets` table. All the data in the column will be lost.
  - Made the column `instrument_role` on table `planets` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."planets" DROP COLUMN "planet_type",
ALTER COLUMN "instrument_role" SET NOT NULL;

-- CreateTable
CREATE TABLE "public"."stars" (
    "id" TEXT NOT NULL,
    "system_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'CENTRAL STAR',
    "properties" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stars_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stars_system_id_key" ON "public"."stars"("system_id");

-- AddForeignKey
ALTER TABLE "public"."stars" ADD CONSTRAINT "stars_system_id_fkey" FOREIGN KEY ("system_id") REFERENCES "public"."stellar_systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
