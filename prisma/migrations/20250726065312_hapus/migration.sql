/*
  Warnings:

  - You are about to drop the column `slug` on the `menus` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "menus_slug_key";

-- AlterTable
ALTER TABLE "menus" DROP COLUMN "slug";
