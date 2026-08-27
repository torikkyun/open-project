/*
  Warnings:

  - You are about to drop the column `taskId` on the `milestones` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "milestones" DROP CONSTRAINT "milestones_taskId_fkey";

-- AlterTable
ALTER TABLE "milestones" DROP COLUMN "taskId",
ADD COLUMN     "task_id" UUID;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
