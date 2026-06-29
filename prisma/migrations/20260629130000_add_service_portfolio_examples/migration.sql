CREATE TABLE "ServicePortfolioExample" (
  "id" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ServicePortfolioExample_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ServicePortfolioExample_serviceId_projectId_key"
ON "ServicePortfolioExample"("serviceId", "projectId");

CREATE INDEX "ServicePortfolioExample_serviceId_order_idx"
ON "ServicePortfolioExample"("serviceId", "order");

ALTER TABLE "ServicePortfolioExample"
ADD CONSTRAINT "ServicePortfolioExample_serviceId_fkey"
FOREIGN KEY ("serviceId") REFERENCES "Service"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServicePortfolioExample"
ADD CONSTRAINT "ServicePortfolioExample_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "Project"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
