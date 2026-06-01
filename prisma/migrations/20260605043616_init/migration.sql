-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "headquarters" TEXT NOT NULL,
    "founded_year" INTEGER,
    "headcount_range" TEXT,
    "description" TEXT,
    "website" TEXT,
    "logo_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "salaries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "experience_years" INTEGER NOT NULL,
    "base_salary" REAL NOT NULL,
    "bonus" REAL NOT NULL DEFAULT 0,
    "stock" REAL NOT NULL DEFAULT 0,
    "total_compensation" REAL NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'user_submitted',
    "confidence_score" REAL NOT NULL DEFAULT 0.5,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "submitted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "salaries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "pros" TEXT NOT NULL,
    "cons" TEXT NOT NULL,
    "rating" REAL NOT NULL,
    "work_life_balance" REAL NOT NULL DEFAULT 0,
    "culture" REAL NOT NULL DEFAULT 0,
    "growth" REAL NOT NULL DEFAULT 0,
    "compensation" REAL NOT NULL DEFAULT 0,
    "anonymous_role" TEXT,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "submitted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reviews_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "interviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "rounds" INTEGER NOT NULL DEFAULT 1,
    "questions" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "tips" TEXT,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "submitted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "interviews_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "company_comparisons" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company_a_id" TEXT NOT NULL,
    "company_b_id" TEXT NOT NULL,
    "metrics" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "company_comparisons_company_a_id_fkey" FOREIGN KEY ("company_a_id") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "company_comparisons_company_b_id_fkey" FOREIGN KEY ("company_b_id") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "workplace_indices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company_id" TEXT NOT NULL,
    "culture_score" REAL NOT NULL DEFAULT 0,
    "compensation_score" REAL NOT NULL DEFAULT 0,
    "growth_score" REAL NOT NULL DEFAULT 0,
    "diversity_score" REAL NOT NULL DEFAULT 0,
    "remote_score" REAL NOT NULL DEFAULT 0,
    "overall_score" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "workplace_indices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_contributions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "data" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "community_posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "author_tag" TEXT,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "community_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "post_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author_tag" TEXT,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "community_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE INDEX "salaries_company_id_idx" ON "salaries"("company_id");

-- CreateIndex
CREATE INDEX "salaries_role_idx" ON "salaries"("role");

-- CreateIndex
CREATE INDEX "salaries_level_idx" ON "salaries"("level");

-- CreateIndex
CREATE INDEX "salaries_location_idx" ON "salaries"("location");

-- CreateIndex
CREATE INDEX "reviews_company_id_idx" ON "reviews"("company_id");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");

-- CreateIndex
CREATE INDEX "interviews_company_id_idx" ON "interviews"("company_id");

-- CreateIndex
CREATE INDEX "interviews_difficulty_idx" ON "interviews"("difficulty");

-- CreateIndex
CREATE INDEX "company_comparisons_company_a_id_idx" ON "company_comparisons"("company_a_id");

-- CreateIndex
CREATE INDEX "company_comparisons_company_b_id_idx" ON "company_comparisons"("company_b_id");

-- CreateIndex
CREATE UNIQUE INDEX "workplace_indices_company_id_key" ON "workplace_indices"("company_id");

-- CreateIndex
CREATE INDEX "user_contributions_type_idx" ON "user_contributions"("type");

-- CreateIndex
CREATE INDEX "user_contributions_status_idx" ON "user_contributions"("status");

-- CreateIndex
CREATE INDEX "community_posts_category_idx" ON "community_posts"("category");

-- CreateIndex
CREATE INDEX "community_comments_post_id_idx" ON "community_comments"("post_id");
