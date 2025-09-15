-- CreateEnum
CREATE TYPE "public"."ObjectType" AS ENUM ('STAR', 'PLANET');

-- AlterTable
ALTER TABLE "public"."planets" ADD COLUMN     "object_type" "public"."ObjectType" NOT NULL DEFAULT 'PLANET';

-- AlterTable
ALTER TABLE "public"."stars" ADD COLUMN     "object_type" "public"."ObjectType" NOT NULL DEFAULT 'STAR';
