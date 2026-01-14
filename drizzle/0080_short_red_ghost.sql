CREATE TABLE "erp_floor_patterns" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	CONSTRAINT "erp_floor_patterns_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "erp_mounting_methods" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	CONSTRAINT "erp_mounting_methods_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "erp_structures" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	CONSTRAINT "erp_structures_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "erp_wear_classes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	CONSTRAINT "erp_wear_classes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "erp_products" ADD COLUMN "mounting_method_id" text;--> statement-breakpoint
ALTER TABLE "erp_products" ADD COLUMN "floor_pattern_id" text;--> statement-breakpoint
ALTER TABLE "erp_products" ADD COLUMN "wear_class_id" text;--> statement-breakpoint
ALTER TABLE "erp_products" ADD COLUMN "structure_id" text;--> statement-breakpoint
ALTER TABLE "erp_products" ADD CONSTRAINT "erp_products_mounting_method_id_erp_mounting_methods_id_fk" FOREIGN KEY ("mounting_method_id") REFERENCES "public"."erp_mounting_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_products" ADD CONSTRAINT "erp_products_floor_pattern_id_erp_floor_patterns_id_fk" FOREIGN KEY ("floor_pattern_id") REFERENCES "public"."erp_floor_patterns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_products" ADD CONSTRAINT "erp_products_wear_class_id_erp_wear_classes_id_fk" FOREIGN KEY ("wear_class_id") REFERENCES "public"."erp_wear_classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "erp_products" ADD CONSTRAINT "erp_products_structure_id_erp_structures_id_fk" FOREIGN KEY ("structure_id") REFERENCES "public"."erp_structures"("id") ON DELETE no action ON UPDATE no action;