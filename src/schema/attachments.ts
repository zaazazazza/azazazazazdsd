import { createInsertSchema } from "drizzle-zod";
import { pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const attachmentsTable = pgTable("shop_attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id").notNull(),
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  objectPath: text("object_path"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAttachmentSchema = createInsertSchema(attachmentsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAttachment = z.infer<typeof insertAttachmentSchema>;
export type Attachment = typeof attachmentsTable.$inferSelect;