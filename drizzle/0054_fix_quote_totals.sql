import { sql } from "drizzle-orm";
import { pgTable, text, integer, timestamp, boolean, json, doublePrecision, index, uniqueIndex, real } from "drizzle-orm/pg-core";

export const quotes = pgTable("quotes", {
	totalNet: doublePrecision("total_net").default(0).notNull(),
	totalGross: doublePrecision("total_gross").default(0).notNull(),
});
