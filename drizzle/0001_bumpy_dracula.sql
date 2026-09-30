CREATE TABLE "candidates" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"source_name" varchar(100) NOT NULL,
	"feed_id" varchar(50) NOT NULL,
	"published_at" timestamp with time zone NOT NULL,
	"manual" boolean DEFAULT false NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "candidates_url_unique" UNIQUE("url")
);
--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "sources" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "image_resource_id" integer;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "wp_id" integer;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_wp_id_unique" UNIQUE("wp_id");