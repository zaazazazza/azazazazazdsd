import { createInsertSchema } from "drizzle-zod";
import { pgTable, text, doublePrecision, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const invoicesTable = pgTable("shop_payment_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id"),
  orderId: text("order_id"),
  paymentAddress: text("payment_address"),
  accessTokenHash: text("access_token_hash"),
  paymentUrl: text("payment_url"),
  expectedAmountLtc: doublePrecision("expected_amount_ltc").notNull(),
  expectedAmountFiat: doublePrecision("expected_amount_fiat").notNull(),
  currency: text("currency").notNull().default("EUR"),
  status: text("status").notNull().default("WAITING_PAYMENT"),
  txid: text("txid").unique(),
  confirmations: integer("confirmations").notNull().default(0),
  requiredConfirmations: integer("required_confirmations").notNull().default(1),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;