import { createInsertSchema } from "drizzle-zod";
import { pgTable, text, integer, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const ticketsTable = pgTable("shop_tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  channelId: text("channel_id").notNull().unique(),
  channelName: text("channel_name").notNull(),
  customerName: text("customer_name"),
  customerId: text("customer_id"),
  productName: text("product_name"),
  detectedProductId: uuid("detected_product_id"),
  status: text("status").notNull().default("open"),
  hasLitecoinEmbed: boolean("has_litecoin_embed").notNull().default(false),
  attachmentCount: integer("attachment_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTicketSchema = createInsertSchema(ticketsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof ticketsTable.$inferSelect;