-- CreateTable
CREATE TABLE "LeaderVote" (
    "id" SERIAL NOT NULL,
    "month" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "voterId" INTEGER NOT NULL,
    "tlId" INTEGER NOT NULL,
    "teamId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaderVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeaderVote_tlId_month_idx" ON "LeaderVote"("tlId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderVote_voterId_month_key" ON "LeaderVote"("voterId", "month");

-- AddForeignKey
ALTER TABLE "LeaderVote" ADD CONSTRAINT "LeaderVote_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderVote" ADD CONSTRAINT "LeaderVote_tlId_fkey" FOREIGN KEY ("tlId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
