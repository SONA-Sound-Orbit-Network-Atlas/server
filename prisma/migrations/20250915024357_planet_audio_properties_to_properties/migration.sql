/*
  Warnings:

  - You are about to drop the column `audio_properties` on the `planets` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."planets" DROP COLUMN "audio_properties",
ADD COLUMN     "properties" JSONB DEFAULT '{}';
