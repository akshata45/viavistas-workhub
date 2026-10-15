-- CreateTable
CREATE TABLE "EmployeeOfMonth" (
    "id" SERIAL NOT NULL,
    "month" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "teamName" TEXT,
    "note" TEXT,
    "confirmedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeOfMonth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeOfMonth_month_key" ON "EmployeeOfMonth"("month");

-- AddForeignKey
ALTER TABLE "EmployeeOfMonth" ADD CONSTRAINT "EmployeeOfMonth_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeOfMonth" ADD CONSTRAINT "EmployeeOfMonth_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
