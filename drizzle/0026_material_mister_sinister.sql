CREATE TABLE "util_plan" (
	"id" serial PRIMARY KEY NOT NULL,
	"day" varchar(10) NOT NULL,
	"type" varchar(20) NOT NULL,
	"topic" text NOT NULL,
	"angle" text NOT NULL,
	"tools" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"locality" varchar(100),
	"status" varchar(20) DEFAULT 'propus' NOT NULL,
	"article_id" integer,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "util_plan_day_idx" ON "util_plan" USING btree ("day");