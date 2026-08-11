CREATE TYPE "public"."article_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."section" AS ENUM('regiuni', 'national', 'international', 'diaspora');--> statement-breakpoint
CREATE TABLE "articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" text NOT NULL,
	"lead_text" text NOT NULL,
	"body_html" text NOT NULL,
	"meta_description" varchar(200) NOT NULL,
	"section" "section" NOT NULL,
	"locality" varchar(100),
	"country" varchar(100),
	"topics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "article_status" DEFAULT 'draft' NOT NULL,
	"normalized_title_hash" varchar(64) NOT NULL,
	"source_count" integer NOT NULL,
	"quality_score" real NOT NULL,
	"image_url" text,
	"image_alt_text" text,
	"source_urls" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "pipeline_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"candidates_fetched" integer DEFAULT 0 NOT NULL,
	"candidates_classified" integer DEFAULT 0 NOT NULL,
	"articles_published" integer DEFAULT 0 NOT NULL,
	"error_message" text
);
