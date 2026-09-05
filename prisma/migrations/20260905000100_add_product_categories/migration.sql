CREATE TABLE IF NOT EXISTS "ProductCategory" (
    "productId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("productId", "categoryId"),
    CONSTRAINT "ProductCategory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ProductCategory_categoryId_idx" ON "ProductCategory"("categoryId");
INSERT INTO "ProductCategory" ("productId", "categoryId") SELECT "id", "categoryId" FROM "Product" ON CONFLICT ("productId", "categoryId") DO NOTHING;
