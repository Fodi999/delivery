-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true;
