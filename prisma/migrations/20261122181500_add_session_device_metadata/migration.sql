-- AlterTable
ALTER TABLE "sessions" ADD COLUMN "browser_name" TEXT,
ADD COLUMN "browser_version" TEXT,
ADD COLUMN "os_name" TEXT,
ADD COLUMN "os_version" TEXT,
ADD COLUMN "device_type" TEXT,
ADD COLUMN "device_vendor" TEXT,
ADD COLUMN "device_model" TEXT,
ADD COLUMN "cpu_architecture" TEXT;
