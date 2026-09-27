import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { pgTable, text, doublePrecision, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const productsTable = pgTable("shop_products", {
  id: uuid("id").primaryKey().defaultRandom(),
  komerzaId: text("komerza_id").unique(),
  name: text("name").notNull(),
  sku: text("sku"),
  imageUrl: text("image_url"),
  imageUrls: text("image_urls").array().notNull().default(sql`'{}'::text[]`),
  price: doublePrecision("price").notNull().default(0),
  currency: text("currency").notNull().default("EUR"),
  stock: integer("stock").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(3),
  status: text("status").notNull().default("out_of_stock"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertProductSchema = createInsertSchema(productsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof productsTable.$inferSelect;