-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EtaSource" AS ENUM ('CLIA', 'RICOS_OPT', 'RICOS_DES', 'RICOS_MIN', 'MANUAL');

-- CreateEnum
CREATE TYPE "TargetStatus" AS ENUM ('PROVISIONAL', 'PROPUESTA', 'ESTABLECIDA');

-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('ACEPTADA', 'ADVERTENCIA', 'RECHAZADA');

-- CreateTable
CREATE TABLE "LabProfile" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nit" TEXT,
    "direccion" TEXT,
    "responsable" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "defaultLevels" INTEGER NOT NULL DEFAULT 2,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TriggerEvent" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TriggerEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalQcProvider" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "acreditacion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalQcProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analyte" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "unidad" TEXT,
    "decimales" INTEGER NOT NULL DEFAULT 2,
    "metodo" TEXT,
    "equipo" TEXT,
    "etaValue" DOUBLE PRECISION,
    "etaSource" "EtaSource" NOT NULL DEFAULT 'MANUAL',
    "cvi" DOUBLE PRECISION,
    "cvg" DOUBLE PRECISION,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Analyte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ControlLot" (
    "id" TEXT NOT NULL,
    "fabricante" TEXT NOT NULL,
    "nombreComercial" TEXT,
    "levelLabel" TEXT NOT NULL,
    "levelIndex" INTEGER NOT NULL,
    "numeroLote" TEXT NOT NULL,
    "vencimiento" TIMESTAMP(3),
    "apertura" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ControlLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotAnalyteTarget" (
    "id" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "analyteId" TEXT NOT NULL,
    "insertMean" DOUBLE PRECISION NOT NULL,
    "insertSd" DOUBLE PRECISION NOT NULL,
    "insertCv" DOUBLE PRECISION,
    "establishedMean" DOUBLE PRECISION,
    "establishedSd" DOUBLE PRECISION,
    "nEstablished" INTEGER NOT NULL DEFAULT 0,
    "status" "TargetStatus" NOT NULL DEFAULT 'PROVISIONAL',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LotAnalyteTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QcRun" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "triggerEventId" TEXT,
    "operador" TEXT,
    "notas" TEXT,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QcRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QcResult" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "analyteId" TEXT NOT NULL,
    "lotId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "zScore" DOUBLE PRECISION,
    "rulesViolated" JSONB,
    "status" "ResultStatus" NOT NULL DEFAULT 'ACEPTADA',
    "correctiveAction" TEXT,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QcResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderAnalyte" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "analyteId" TEXT NOT NULL,

    CONSTRAINT "ProviderAnalyte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalQc" (
    "id" TEXT NOT NULL,
    "analyteId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "ciclo" TEXT NOT NULL,
    "nivel" TEXT,
    "labResult" DOUBLE PRECISION NOT NULL,
    "targetValue" DOUBLE PRECISION,
    "sdGroup" DOUBLE PRECISION,
    "sdi" DOUBLE PRECISION,
    "biasPct" DOUBLE PRECISION,
    "evaluacion" TEXT,
    "notas" TEXT,
    "fecha" TIMESTAMP(3),
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalQc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndicatorSnapshot" (
    "id" TEXT NOT NULL,
    "analyteId" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "cvPct" DOUBLE PRECISION,
    "biasPct" DOUBLE PRECISION,
    "tePct" DOUBLE PRECISION,
    "sigma" DOUBLE PRECISION,
    "uncertaintyU" DOUBLE PRECISION,
    "rulesRecommended" JSONB,
    "analysisText" TEXT,
    "signedBy" TEXT,
    "signedAt" TIMESTAMP(3),
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndicatorSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Area_nombre_key" ON "Area"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "TriggerEvent_nombre_key" ON "TriggerEvent"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalQcProvider_nombre_key" ON "ExternalQcProvider"("nombre");

-- CreateIndex
CREATE INDEX "Analyte_areaId_idx" ON "Analyte"("areaId");

-- CreateIndex
CREATE INDEX "Analyte_tenantId_idx" ON "Analyte"("tenantId");

-- CreateIndex
CREATE INDEX "ControlLot_activo_idx" ON "ControlLot"("activo");

-- CreateIndex
CREATE INDEX "ControlLot_tenantId_idx" ON "ControlLot"("tenantId");

-- CreateIndex
CREATE INDEX "LotAnalyteTarget_analyteId_idx" ON "LotAnalyteTarget"("analyteId");

-- CreateIndex
CREATE UNIQUE INDEX "LotAnalyteTarget_lotId_analyteId_key" ON "LotAnalyteTarget"("lotId", "analyteId");

-- CreateIndex
CREATE INDEX "QcRun_fecha_idx" ON "QcRun"("fecha");

-- CreateIndex
CREATE INDEX "QcRun_tenantId_idx" ON "QcRun"("tenantId");

-- CreateIndex
CREATE INDEX "QcResult_analyteId_lotId_idx" ON "QcResult"("analyteId", "lotId");

-- CreateIndex
CREATE INDEX "QcResult_runId_idx" ON "QcResult"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderAnalyte_providerId_analyteId_key" ON "ProviderAnalyte"("providerId", "analyteId");

-- CreateIndex
CREATE INDEX "ExternalQc_analyteId_idx" ON "ExternalQc"("analyteId");

-- CreateIndex
CREATE INDEX "ExternalQc_providerId_idx" ON "ExternalQc"("providerId");

-- CreateIndex
CREATE INDEX "IndicatorSnapshot_analyteId_idx" ON "IndicatorSnapshot"("analyteId");

-- CreateIndex
CREATE UNIQUE INDEX "IndicatorSnapshot_analyteId_periodo_key" ON "IndicatorSnapshot"("analyteId", "periodo");

-- AddForeignKey
ALTER TABLE "Analyte" ADD CONSTRAINT "Analyte_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotAnalyteTarget" ADD CONSTRAINT "LotAnalyteTarget_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "ControlLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotAnalyteTarget" ADD CONSTRAINT "LotAnalyteTarget_analyteId_fkey" FOREIGN KEY ("analyteId") REFERENCES "Analyte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QcRun" ADD CONSTRAINT "QcRun_triggerEventId_fkey" FOREIGN KEY ("triggerEventId") REFERENCES "TriggerEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QcResult" ADD CONSTRAINT "QcResult_runId_fkey" FOREIGN KEY ("runId") REFERENCES "QcRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QcResult" ADD CONSTRAINT "QcResult_analyteId_fkey" FOREIGN KEY ("analyteId") REFERENCES "Analyte"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QcResult" ADD CONSTRAINT "QcResult_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "ControlLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderAnalyte" ADD CONSTRAINT "ProviderAnalyte_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ExternalQcProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderAnalyte" ADD CONSTRAINT "ProviderAnalyte_analyteId_fkey" FOREIGN KEY ("analyteId") REFERENCES "Analyte"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalQc" ADD CONSTRAINT "ExternalQc_analyteId_fkey" FOREIGN KEY ("analyteId") REFERENCES "Analyte"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalQc" ADD CONSTRAINT "ExternalQc_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ExternalQcProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IndicatorSnapshot" ADD CONSTRAINT "IndicatorSnapshot_analyteId_fkey" FOREIGN KEY ("analyteId") REFERENCES "Analyte"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
