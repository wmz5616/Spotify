/*
  Warnings:

  - You are about to drop the column `cover` on the `Album` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Album" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "uniqueId" TEXT NOT NULL,
    "coverPath" TEXT
);
INSERT INTO "new_Album" ("id", "title", "uniqueId") SELECT "id", "title", "uniqueId" FROM "Album";
DROP TABLE "Album";
ALTER TABLE "new_Album" RENAME TO "Album";
CREATE UNIQUE INDEX "Album_uniqueId_key" ON "Album"("uniqueId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
