/*
  Warnings:

  - You are about to drop the column `status` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `Timer` table. All the data in the column will be lost.
  - You are about to drop the column `elapsedMs` on the `Timer` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `Timer` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `Timer` table. All the data in the column will be lost.
  - You are about to drop the column `totalPausedMs` on the `Timer` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `xp` on the `User` table. All the data in the column will be lost.
  - You are about to alter the column `metadata` on the `XPHistory` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - Added the required column `startTime` to the `Timer` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "client" TEXT,
    "color" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "ownerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("client", "createdAt", "id", "name", "ownerId", "updatedAt") SELECT "client", "createdAt", "id", "name", "ownerId", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE INDEX "Project_ownerId_idx" ON "Project"("ownerId");
CREATE INDEX "Project_name_idx" ON "Project"("name");
CREATE INDEX "Project_archived_idx" ON "Project"("archived");
CREATE INDEX "Project_client_idx" ON "Project"("client");
CREATE INDEX "Project_createdAt_idx" ON "Project"("createdAt");
CREATE UNIQUE INDEX "Project_ownerId_name_key" ON "Project"("ownerId", "name");
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "priority" TEXT DEFAULT 'MEDIUM',
    "dueDate" DATETIME,
    "estimatedMinutes" INTEGER,
    "actualMinutes" INTEGER,
    "assigneeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("assigneeId", "createdAt", "description", "id", "projectId", "title", "updatedAt") SELECT "assigneeId", "createdAt", "description", "id", "projectId", "title", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");
CREATE INDEX "Task_assigneeId_idx" ON "Task"("assigneeId");
CREATE INDEX "Task_completed_idx" ON "Task"("completed");
CREATE INDEX "Task_priority_idx" ON "Task"("priority");
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");
CREATE INDEX "Task_createdAt_idx" ON "Task"("createdAt");
CREATE INDEX "Task_title_idx" ON "Task"("title");
CREATE TABLE "new_TimeEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "taskId" TEXT,
    "date" DATETIME NOT NULL,
    "description" TEXT,
    "billable" BOOLEAN NOT NULL DEFAULT false,
    "minutes" INTEGER NOT NULL,
    "sourceTimer" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TimeEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TimeEntry_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TimeEntry" ("billable", "createdAt", "date", "description", "id", "minutes", "projectId", "sourceTimer", "taskId", "updatedAt", "userId") SELECT "billable", "createdAt", "date", "description", "id", "minutes", "projectId", "sourceTimer", "taskId", "updatedAt", "userId" FROM "TimeEntry";
DROP TABLE "TimeEntry";
ALTER TABLE "new_TimeEntry" RENAME TO "TimeEntry";
CREATE INDEX "TimeEntry_userId_idx" ON "TimeEntry"("userId");
CREATE INDEX "TimeEntry_projectId_idx" ON "TimeEntry"("projectId");
CREATE INDEX "TimeEntry_taskId_idx" ON "TimeEntry"("taskId");
CREATE INDEX "TimeEntry_date_idx" ON "TimeEntry"("date");
CREATE INDEX "TimeEntry_billable_idx" ON "TimeEntry"("billable");
CREATE INDEX "TimeEntry_userId_date_idx" ON "TimeEntry"("userId", "date");
CREATE INDEX "TimeEntry_userId_projectId_idx" ON "TimeEntry"("userId", "projectId");
CREATE INDEX "TimeEntry_userId_taskId_idx" ON "TimeEntry"("userId", "taskId");
CREATE INDEX "TimeEntry_sourceTimer_idx" ON "TimeEntry"("sourceTimer");
CREATE INDEX "TimeEntry_createdAt_idx" ON "TimeEntry"("createdAt");
CREATE TABLE "new_Timer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "taskId" TEXT,
    "description" TEXT,
    "billable" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "pausedAt" DATETIME,
    "totalPausedTime" INTEGER NOT NULL DEFAULT 0,
    "elapsedTime" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Timer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Timer_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Timer_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Timer" ("billable", "createdAt", "id", "pausedAt", "projectId", "status", "taskId", "updatedAt", "userId") SELECT "billable", "createdAt", "id", "pausedAt", "projectId", "status", "taskId", "updatedAt", "userId" FROM "Timer";
DROP TABLE "Timer";
ALTER TABLE "new_Timer" RENAME TO "Timer";
CREATE INDEX "Timer_userId_idx" ON "Timer"("userId");
CREATE INDEX "Timer_projectId_idx" ON "Timer"("projectId");
CREATE INDEX "Timer_taskId_idx" ON "Timer"("taskId");
CREATE INDEX "Timer_status_idx" ON "Timer"("status");
CREATE INDEX "Timer_userId_status_idx" ON "Timer"("userId", "status");
CREATE INDEX "Timer_userId_projectId_idx" ON "Timer"("userId", "projectId");
CREATE INDEX "Timer_userId_taskId_idx" ON "Timer"("userId", "taskId");
CREATE INDEX "Timer_startTime_idx" ON "Timer"("startTime");
CREATE INDEX "Timer_endTime_idx" ON "Timer"("endTime");
CREATE INDEX "Timer_billable_idx" ON "Timer"("billable");
CREATE INDEX "Timer_createdAt_idx" ON "Timer"("createdAt");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "clerkId" TEXT,
    "hashedPassword" TEXT,
    "totalXP" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "preferences" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActiveAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "level", "name", "updatedAt") SELECT "createdAt", "email", "id", "level", "name", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_clerkId_idx" ON "User"("clerkId");
CREATE INDEX "User_isActive_idx" ON "User"("isActive");
CREATE INDEX "User_lastActiveAt_idx" ON "User"("lastActiveAt");
CREATE INDEX "User_totalXP_idx" ON "User"("totalXP");
CREATE INDEX "User_level_idx" ON "User"("level");
CREATE TABLE "new_UserAchievement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "xpReward" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserAchievement" ("achievementId", "category", "description", "id", "rarity", "title", "unlockedAt", "userId", "xpReward") SELECT "achievementId", "category", "description", "id", "rarity", "title", "unlockedAt", "userId", "xpReward" FROM "UserAchievement";
DROP TABLE "UserAchievement";
ALTER TABLE "new_UserAchievement" RENAME TO "UserAchievement";
CREATE INDEX "UserAchievement_userId_idx" ON "UserAchievement"("userId");
CREATE INDEX "UserAchievement_achievementId_idx" ON "UserAchievement"("achievementId");
CREATE INDEX "UserAchievement_category_idx" ON "UserAchievement"("category");
CREATE INDEX "UserAchievement_rarity_idx" ON "UserAchievement"("rarity");
CREATE INDEX "UserAchievement_unlockedAt_idx" ON "UserAchievement"("unlockedAt");
CREATE INDEX "UserAchievement_userId_category_idx" ON "UserAchievement"("userId", "category");
CREATE INDEX "UserAchievement_userId_rarity_idx" ON "UserAchievement"("userId", "rarity");
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_key" ON "UserAchievement"("userId", "achievementId");
CREATE TABLE "new_UserChallenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "target" INTEGER NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 0,
    "xpReward" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "date" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserChallenge" ("challengeId", "completed", "createdAt", "current", "date", "description", "id", "target", "title", "type", "updatedAt", "userId", "xpReward") SELECT "challengeId", "completed", "createdAt", "current", "date", "description", "id", "target", "title", "type", "updatedAt", "userId", "xpReward" FROM "UserChallenge";
DROP TABLE "UserChallenge";
ALTER TABLE "new_UserChallenge" RENAME TO "UserChallenge";
CREATE INDEX "UserChallenge_userId_idx" ON "UserChallenge"("userId");
CREATE INDEX "UserChallenge_challengeId_idx" ON "UserChallenge"("challengeId");
CREATE INDEX "UserChallenge_type_idx" ON "UserChallenge"("type");
CREATE INDEX "UserChallenge_completed_idx" ON "UserChallenge"("completed");
CREATE INDEX "UserChallenge_date_idx" ON "UserChallenge"("date");
CREATE INDEX "UserChallenge_userId_date_idx" ON "UserChallenge"("userId", "date");
CREATE INDEX "UserChallenge_userId_completed_idx" ON "UserChallenge"("userId", "completed");
CREATE INDEX "UserChallenge_userId_type_idx" ON "UserChallenge"("userId", "type");
CREATE UNIQUE INDEX "UserChallenge_userId_challengeId_date_key" ON "UserChallenge"("userId", "challengeId", "date");
CREATE TABLE "new_XPHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "xpEarned" INTEGER NOT NULL,
    "description" TEXT,
    "timerId" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "XPHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "XPHistory_timerId_fkey" FOREIGN KEY ("timerId") REFERENCES "Timer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_XPHistory" ("action", "createdAt", "description", "id", "metadata", "timerId", "userId", "xpEarned") SELECT "action", "createdAt", "description", "id", "metadata", "timerId", "userId", "xpEarned" FROM "XPHistory";
DROP TABLE "XPHistory";
ALTER TABLE "new_XPHistory" RENAME TO "XPHistory";
CREATE INDEX "XPHistory_userId_idx" ON "XPHistory"("userId");
CREATE INDEX "XPHistory_timerId_idx" ON "XPHistory"("timerId");
CREATE INDEX "XPHistory_action_idx" ON "XPHistory"("action");
CREATE INDEX "XPHistory_userId_createdAt_idx" ON "XPHistory"("userId", "createdAt");
CREATE INDEX "XPHistory_userId_action_idx" ON "XPHistory"("userId", "action");
CREATE INDEX "XPHistory_createdAt_idx" ON "XPHistory"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
