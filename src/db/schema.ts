import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const listsTable = sqliteTable("lists", {
    id: int().primaryKey({ autoIncrement: true }),
    name: text().notNull(),
    description: text().notNull(),
    createdAt: int().notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: int().notNull().default(sql`CURRENT_TIMESTAMP`),
    isActive: int().notNull().default(1),
    userId: text().notNull(),
});

export const listItemsTable = sqliteTable("listItems", {
    id: int().primaryKey({ autoIncrement: true }),
    listId: int().notNull(),

    name: text().notNull(),
    link: text().notNull(),
    price: int().notNull(),
    quantity: int().notNull(),

    createdAt: int().notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: int().notNull().default(sql`CURRENT_TIMESTAMP`),
    isActive: int().notNull().default(1),
});