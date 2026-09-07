CREATE TABLE "cities" (
	"id" serial PRIMARY KEY NOT NULL,
	"market_id" integer,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"tagline" text,
	"description" text,
	"latitude" double precision,
	"longitude" double precision,
	"stats" jsonb DEFAULT '[]'::jsonb,
	"cover_image" text,
	"featured" boolean DEFAULT false NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cities_market_idx" ON "cities" USING btree ("market_id");--> statement-breakpoint
CREATE INDEX "cities_published_idx" ON "cities" USING btree ("published");