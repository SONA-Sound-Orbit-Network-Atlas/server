-- CreateIndex
CREATE INDEX "likes_system_id_created_at_idx" ON "public"."likes"("system_id", "created_at");

-- CreateIndex
CREATE INDEX "likes_created_at_idx" ON "public"."likes"("created_at");
