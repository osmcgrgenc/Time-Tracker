-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "public"."TimerStatus" AS ENUM ('RUNNING', 'PAUSED', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "public"."Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."AchievementRarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "public"."ChallengeType" AS ENUM ('TIME', 'TASKS', 'STREAK', 'FOCUS');

-- CreateEnum
CREATE TYPE "public"."XPAction" AS ENUM ('TIMER_STARTED', 'TIMER_COMPLETED', 'TIMER_CANCELLED', 'STREAK_BONUS', 'LEVEL_UP', 'DAILY_GOAL');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "clerkId" VARCHAR(255),
    "hashedPassword" VARCHAR(255),
    "totalXP" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "preferences" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActiveAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "client" VARCHAR(255),
    "color" VARCHAR(7),
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "projectId" UUID NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "priority" "public"."Priority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMPTZ,
    "estimatedMinutes" INTEGER,
    "actualMinutes" INTEGER,
    "assigneeId" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."timers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "projectId" UUID,
    "taskId" UUID,
    "description" TEXT,
    "billable" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."TimerStatus" NOT NULL DEFAULT 'RUNNING',
    "startTime" TIMESTAMPTZ NOT NULL,
    "endTime" TIMESTAMPTZ,
    "pausedAt" TIMESTAMPTZ,
    "totalPausedTime" INTEGER NOT NULL DEFAULT 0,
    "elapsedTime" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "timers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."time_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "projectId" UUID,
    "taskId" UUID,
    "date" DATE NOT NULL,
    "description" TEXT,
    "billable" BOOLEAN NOT NULL DEFAULT false,
    "minutes" INTEGER NOT NULL,
    "sourceTimer" UUID,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."xp_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "action" "public"."XPAction" NOT NULL,
    "xpEarned" INTEGER NOT NULL,
    "description" TEXT,
    "timerId" UUID,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "xp_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_challenges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "challengeId" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "target" INTEGER NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 0,
    "xpReward" INTEGER NOT NULL,
    "type" "public"."ChallengeType" NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_achievements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "achievementId" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "xpReward" INTEGER NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "rarity" "public"."AchievementRarity" NOT NULL,
    "unlockedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkId_key" ON "public"."users"("clerkId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users" USING HASH ("email");

-- CreateIndex
CREATE INDEX "users_clerkId_idx" ON "public"."users" USING HASH ("clerkId");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "public"."users"("isActive");

-- CreateIndex
CREATE INDEX "users_lastActiveAt_idx" ON "public"."users"("lastActiveAt");

-- CreateIndex
CREATE INDEX "users_totalXP_idx" ON "public"."users"("totalXP");

-- CreateIndex
CREATE INDEX "users_level_idx" ON "public"."users"("level");

-- CreateIndex
CREATE INDEX "users_email_isActive_idx" ON "public"."users"("email", "isActive");

-- CreateIndex
CREATE INDEX "users_totalXP_level_idx" ON "public"."users"("totalXP", "level");

-- CreateIndex
CREATE INDEX "projects_ownerId_idx" ON "public"."projects"("ownerId");

-- CreateIndex
CREATE INDEX "projects_name_idx" ON "public"."projects"("name");

-- CreateIndex
CREATE INDEX "projects_archived_idx" ON "public"."projects"("archived");

-- CreateIndex
CREATE INDEX "projects_client_idx" ON "public"."projects"("client");

-- CreateIndex
CREATE INDEX "projects_createdAt_idx" ON "public"."projects"("createdAt");

-- CreateIndex
CREATE INDEX "projects_ownerId_archived_idx" ON "public"."projects"("ownerId", "archived");

-- CreateIndex
CREATE UNIQUE INDEX "projects_ownerId_name_key" ON "public"."projects"("ownerId", "name");

-- CreateIndex
CREATE INDEX "tasks_projectId_idx" ON "public"."tasks"("projectId");

-- CreateIndex
CREATE INDEX "tasks_assigneeId_idx" ON "public"."tasks"("assigneeId");

-- CreateIndex
CREATE INDEX "tasks_completed_idx" ON "public"."tasks"("completed");

-- CreateIndex
CREATE INDEX "tasks_priority_idx" ON "public"."tasks"("priority");

-- CreateIndex
CREATE INDEX "tasks_dueDate_idx" ON "public"."tasks"("dueDate");

-- CreateIndex
CREATE INDEX "tasks_createdAt_idx" ON "public"."tasks"("createdAt");

-- CreateIndex
CREATE INDEX "tasks_title_idx" ON "public"."tasks"("title");

-- CreateIndex
CREATE INDEX "tasks_projectId_completed_idx" ON "public"."tasks"("projectId", "completed");

-- CreateIndex
CREATE INDEX "tasks_assigneeId_completed_idx" ON "public"."tasks"("assigneeId", "completed");

-- CreateIndex
CREATE INDEX "tasks_dueDate_completed_idx" ON "public"."tasks"("dueDate", "completed");

-- CreateIndex
CREATE INDEX "timers_userId_idx" ON "public"."timers"("userId");

-- CreateIndex
CREATE INDEX "timers_projectId_idx" ON "public"."timers"("projectId");

-- CreateIndex
CREATE INDEX "timers_taskId_idx" ON "public"."timers"("taskId");

-- CreateIndex
CREATE INDEX "timers_status_idx" ON "public"."timers"("status");

-- CreateIndex
CREATE INDEX "timers_userId_status_idx" ON "public"."timers"("userId", "status");

-- CreateIndex
CREATE INDEX "timers_userId_projectId_idx" ON "public"."timers"("userId", "projectId");

-- CreateIndex
CREATE INDEX "timers_userId_taskId_idx" ON "public"."timers"("userId", "taskId");

-- CreateIndex
CREATE INDEX "timers_startTime_idx" ON "public"."timers"("startTime");

-- CreateIndex
CREATE INDEX "timers_endTime_idx" ON "public"."timers"("endTime");

-- CreateIndex
CREATE INDEX "timers_billable_idx" ON "public"."timers"("billable");

-- CreateIndex
CREATE INDEX "timers_createdAt_idx" ON "public"."timers"("createdAt");

-- CreateIndex
CREATE INDEX "timers_userId_startTime_idx" ON "public"."timers"("userId", "startTime");

-- CreateIndex
CREATE INDEX "timers_status_startTime_idx" ON "public"."timers"("status", "startTime");

-- CreateIndex
CREATE INDEX "time_entries_userId_idx" ON "public"."time_entries"("userId");

-- CreateIndex
CREATE INDEX "time_entries_projectId_idx" ON "public"."time_entries"("projectId");

-- CreateIndex
CREATE INDEX "time_entries_taskId_idx" ON "public"."time_entries"("taskId");

-- CreateIndex
CREATE INDEX "time_entries_date_idx" ON "public"."time_entries"("date");

-- CreateIndex
CREATE INDEX "time_entries_billable_idx" ON "public"."time_entries"("billable");

-- CreateIndex
CREATE INDEX "time_entries_userId_date_idx" ON "public"."time_entries"("userId", "date");

-- CreateIndex
CREATE INDEX "time_entries_userId_projectId_idx" ON "public"."time_entries"("userId", "projectId");

-- CreateIndex
CREATE INDEX "time_entries_userId_taskId_idx" ON "public"."time_entries"("userId", "taskId");

-- CreateIndex
CREATE INDEX "time_entries_sourceTimer_idx" ON "public"."time_entries"("sourceTimer");

-- CreateIndex
CREATE INDEX "time_entries_createdAt_idx" ON "public"."time_entries"("createdAt");

-- CreateIndex
CREATE INDEX "time_entries_userId_date_billable_idx" ON "public"."time_entries"("userId", "date", "billable");

-- CreateIndex
CREATE INDEX "time_entries_projectId_date_idx" ON "public"."time_entries"("projectId", "date");

-- CreateIndex
CREATE INDEX "xp_history_userId_idx" ON "public"."xp_history"("userId");

-- CreateIndex
CREATE INDEX "xp_history_timerId_idx" ON "public"."xp_history"("timerId");

-- CreateIndex
CREATE INDEX "xp_history_action_idx" ON "public"."xp_history"("action");

-- CreateIndex
CREATE INDEX "xp_history_userId_createdAt_idx" ON "public"."xp_history"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "xp_history_userId_action_idx" ON "public"."xp_history"("userId", "action");

-- CreateIndex
CREATE INDEX "xp_history_createdAt_idx" ON "public"."xp_history"("createdAt");

-- CreateIndex
CREATE INDEX "xp_history_metadata_idx" ON "public"."xp_history" USING GIN ("metadata");

-- CreateIndex
CREATE INDEX "user_challenges_userId_idx" ON "public"."user_challenges"("userId");

-- CreateIndex
CREATE INDEX "user_challenges_challengeId_idx" ON "public"."user_challenges"("challengeId");

-- CreateIndex
CREATE INDEX "user_challenges_type_idx" ON "public"."user_challenges"("type");

-- CreateIndex
CREATE INDEX "user_challenges_completed_idx" ON "public"."user_challenges"("completed");

-- CreateIndex
CREATE INDEX "user_challenges_date_idx" ON "public"."user_challenges"("date");

-- CreateIndex
CREATE INDEX "user_challenges_userId_date_idx" ON "public"."user_challenges"("userId", "date");

-- CreateIndex
CREATE INDEX "user_challenges_userId_completed_idx" ON "public"."user_challenges"("userId", "completed");

-- CreateIndex
CREATE INDEX "user_challenges_userId_type_idx" ON "public"."user_challenges"("userId", "type");

-- CreateIndex
CREATE INDEX "user_challenges_date_completed_idx" ON "public"."user_challenges"("date", "completed");

-- CreateIndex
CREATE UNIQUE INDEX "user_challenges_userId_challengeId_date_key" ON "public"."user_challenges"("userId", "challengeId", "date");

-- CreateIndex
CREATE INDEX "user_achievements_userId_idx" ON "public"."user_achievements"("userId");

-- CreateIndex
CREATE INDEX "user_achievements_achievementId_idx" ON "public"."user_achievements"("achievementId");

-- CreateIndex
CREATE INDEX "user_achievements_category_idx" ON "public"."user_achievements"("category");

-- CreateIndex
CREATE INDEX "user_achievements_rarity_idx" ON "public"."user_achievements"("rarity");

-- CreateIndex
CREATE INDEX "user_achievements_unlockedAt_idx" ON "public"."user_achievements"("unlockedAt");

-- CreateIndex
CREATE INDEX "user_achievements_userId_category_idx" ON "public"."user_achievements"("userId", "category");

-- CreateIndex
CREATE INDEX "user_achievements_userId_rarity_idx" ON "public"."user_achievements"("userId", "rarity");

-- CreateIndex
CREATE INDEX "user_achievements_category_rarity_idx" ON "public"."user_achievements"("category", "rarity");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_userId_achievementId_key" ON "public"."user_achievements"("userId", "achievementId");

-- AddForeignKey
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."timers" ADD CONSTRAINT "timers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."timers" ADD CONSTRAINT "timers_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."timers" ADD CONSTRAINT "timers_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."time_entries" ADD CONSTRAINT "time_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."time_entries" ADD CONSTRAINT "time_entries_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."time_entries" ADD CONSTRAINT "time_entries_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."xp_history" ADD CONSTRAINT "xp_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."xp_history" ADD CONSTRAINT "xp_history_timerId_fkey" FOREIGN KEY ("timerId") REFERENCES "public"."timers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_challenges" ADD CONSTRAINT "user_challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_achievements" ADD CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
