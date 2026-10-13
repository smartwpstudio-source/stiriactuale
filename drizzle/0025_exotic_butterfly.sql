CREATE TABLE "guide_checks" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"title" text NOT NULL,
	"section" varchar(20) NOT NULL,
	"tool" varchar(300),
	"via" varchar(20) NOT NULL,
	"exempt" varchar(30),
	"topic" varchar(120),
	"reason" text,
	"mode" varchar(10) NOT NULL,
	"rejected" boolean DEFAULT false NOT NULL,
	"article_id" integer
);
--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "guide_tool" varchar(300);--> statement-breakpoint
CREATE INDEX "guide_checks_created_idx" ON "guide_checks" USING btree ("created_at");