import { pgTable, serial, text, jsonb, timestamp } from "drizzle-orm/pg-core";

export const dictionaryEntries = pgTable("dictionary_entries", {
  id: serial("id").primaryKey(),
  word: text("word").notNull().unique(),
  pinyin: text("pinyin"),
  meaning: text("meaning").notNull(),
  type: text("type"),
  examples: jsonb("examples").$type<{ cn: string; pinyin: string; vn: string }[]>().default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

