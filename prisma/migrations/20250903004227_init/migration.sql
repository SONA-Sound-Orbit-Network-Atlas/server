-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "about" TEXT,
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."galaxies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "galaxies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stellar_systems" (
    "id" TEXT NOT NULL,
    "galaxy_id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "original_author_id" TEXT,
    "source_system_id" TEXT,
    "title" TEXT NOT NULL,
    "bpm" INTEGER NOT NULL DEFAULT 120,
    "x" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "y" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "z" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stellar_systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."planets" (
    "id" TEXT NOT NULL,
    "system_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orbit_type" TEXT NOT NULL DEFAULT 'circle',
    "orbit_radius" DOUBLE PRECISION,
    "orbit_a" DOUBLE PRECISION,
    "orbit_b" DOUBLE PRECISION,
    "orbit_rotation_deg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "orbit_inclination_deg" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "orbit_phase0" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "orbit_angular_speed" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "instrument_type" TEXT NOT NULL DEFAULT 'synth',
    "params" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patterns" (
    "id" TEXT NOT NULL,
    "planet_id" TEXT NOT NULL,
    "steps_jsonb" JSONB NOT NULL DEFAULT '[]',
    "length_steps" INTEGER NOT NULL DEFAULT 16,
    "resolution" TEXT NOT NULL DEFAULT '16n',
    "source_pattern_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."likes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "system_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."follows" (
    "follower_id" TEXT NOT NULL,
    "followee_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("follower_id","followee_id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "message" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "patterns_planet_id_key" ON "public"."patterns"("planet_id");

-- CreateIndex
CREATE UNIQUE INDEX "likes_user_id_system_id_key" ON "public"."likes"("user_id", "system_id");

-- CreateIndex
CREATE INDEX "idx_follow_followee" ON "public"."follows"("followee_id");

-- CreateIndex
CREATE INDEX "idx_follow_follower" ON "public"."follows"("follower_id");

-- AddForeignKey
ALTER TABLE "public"."galaxies" ADD CONSTRAINT "galaxies_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stellar_systems" ADD CONSTRAINT "stellar_systems_galaxy_id_fkey" FOREIGN KEY ("galaxy_id") REFERENCES "public"."galaxies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stellar_systems" ADD CONSTRAINT "stellar_systems_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stellar_systems" ADD CONSTRAINT "stellar_systems_original_author_id_fkey" FOREIGN KEY ("original_author_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stellar_systems" ADD CONSTRAINT "stellar_systems_source_system_id_fkey" FOREIGN KEY ("source_system_id") REFERENCES "public"."stellar_systems"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."planets" ADD CONSTRAINT "planets_system_id_fkey" FOREIGN KEY ("system_id") REFERENCES "public"."stellar_systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patterns" ADD CONSTRAINT "patterns_planet_id_fkey" FOREIGN KEY ("planet_id") REFERENCES "public"."planets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patterns" ADD CONSTRAINT "patterns_source_pattern_id_fkey" FOREIGN KEY ("source_pattern_id") REFERENCES "public"."patterns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."likes" ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."likes" ADD CONSTRAINT "likes_system_id_fkey" FOREIGN KEY ("system_id") REFERENCES "public"."stellar_systems"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."follows" ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."follows" ADD CONSTRAINT "follows_followee_id_fkey" FOREIGN KEY ("followee_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
