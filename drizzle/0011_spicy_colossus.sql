ALTER TABLE "articles" ADD COLUMN "kind" varchar(20) DEFAULT 'stire' NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "kind" varchar(20) DEFAULT 'stire' NOT NULL;