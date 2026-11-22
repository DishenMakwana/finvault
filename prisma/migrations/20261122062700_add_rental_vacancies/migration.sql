-- CreateTable
CREATE TABLE "rental_vacancies" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "unit_name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "is_vacant" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rental_vacancies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rental_vacancies_user_id_unit_name_year_month_key" ON "rental_vacancies"("user_id", "unit_name", "year", "month");

-- CreateIndex
CREATE INDEX "rental_vacancies_user_id_year_idx" ON "rental_vacancies"("user_id", "year");

-- AddForeignKey
ALTER TABLE "rental_vacancies" ADD CONSTRAINT "rental_vacancies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
