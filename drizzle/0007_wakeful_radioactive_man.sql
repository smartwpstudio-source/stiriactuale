ALTER TABLE "articles" ADD COLUMN "views" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "tg_views" integer;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "tg_reactions" integer;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "tg_interest" real;