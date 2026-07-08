-- Add product fields used by the Golden Store UI
ALTER TABLE "Product"
ADD COLUMN IF NOT EXISTS "tags" JSONB,
ADD COLUMN IF NOT EXISTS "rating" DOUBLE PRECISION NOT NULL DEFAULT 4.5,
ADD COLUMN IF NOT EXISTS "reviewsCount" INTEGER NOT NULL DEFAULT 0;

-- Store order item preview image so order history can render thumbnails
ALTER TABLE "OrderItem"
ADD COLUMN IF NOT EXISTS "imageUrl" TEXT NOT NULL DEFAULT '';

