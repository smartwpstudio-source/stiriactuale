CREATE TABLE "recipe_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"stars" smallint NOT NULL,
	"voter" char(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recipe_ratings_slug_voter" UNIQUE("slug","voter"),
	CONSTRAINT "recipe_ratings_stars" CHECK ("recipe_ratings"."stars" between 1 and 5)
);
--> statement-breakpoint
CREATE INDEX "recipe_ratings_voter_created" ON "recipe_ratings" USING btree ("voter","created_at");