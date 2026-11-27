import { sql } from "drizzle-orm";
import { index, int, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from 'drizzle-zod';
import { z } from "zod";

export const listsTable = sqliteTable("lists", {
    id: text().primaryKey(),
    name: text().notNull(),
    description: text(),
    createdAt: int().notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: int().notNull().default(sql`CURRENT_TIMESTAMP`),
    isActive: int().notNull().default(1),
    userId: text().notNull(),
    public: int().notNull().default(0),
    shared: int().notNull().default(0),
});

export const listItemsTable = sqliteTable("listItems", {
    id: int().primaryKey({ autoIncrement: true }),
    listId: text().notNull().references(() => listsTable.id, { onDelete: 'cascade' }),

    name: text().notNull(),
    store: text(),
    link: text(),
    // Valores em centavos.
    price: int().notNull(),
    // Preço de referência (cadastro ou última edição manual); o refresh não mexe nele.
    originalPrice: int(),
    quantity: int().notNull(),
    imageUrl: text(),

    priceCheckedAt: int(),
    priceCheckStatus: text({ enum: ["ok", "failed"] }),
    priceCheckFailures: int().notNull().default(0),

    createdAt: int().notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: int().notNull().default(sql`CURRENT_TIMESTAMP`),
    isActive: int().notNull().default(1),
    order: int().notNull().default(0),
});

/** Um link/preço de uma loja para o mesmo item. `listItems.price/link/store` guardam o mais barato. */
export const itemLinksTable = sqliteTable("itemLinks", {
    id: int().primaryKey({ autoIncrement: true }),
    itemId: int().notNull().references(() => listItemsTable.id, { onDelete: 'cascade' }),

    link: text().notNull(),
    store: text(),
    price: int().notNull(),

    createdAt: int().notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("itemLinks_item_link_idx").on(table.itemId, table.link)])


export const priceHistoryTable = sqliteTable("priceHistory", {
    id: int().primaryKey({ autoIncrement: true }),
    itemId: int().notNull().references(() => listItemsTable.id, { onDelete: 'cascade' }),
    // Centavos.
    price: int().notNull(),
    // Epoch em ms, sempre informado pelo código.
    checkedAt: int().notNull(),
    source: text({ enum: ["initial", "manual", "scrape"] }).notNull(),
}, (table) => [index("priceHistory_item_checked_idx").on(table.itemId, table.checkedAt)]);

export const sharedListsTable = sqliteTable("sharedLists", {
    id: text().primaryKey(),
    listId: text().notNull(),
    userId: text().notNull(),
})



export const listInsertSchema = createInsertSchema(listsTable);

export const listItemInsertSchema = createInsertSchema(listItemsTable, {
    name: (schema) => schema.min(2, {
        message: "Nome deve ter pelo menos 2 caracteres.",
    }),
    link: (schema) => schema.url({
        message: "Link deve ser uma URL válida.",
    }),
    store: (schema) => schema.min(2, {
        message: "Loja deve ter pelo menos 2 caracteres.",
    }),
    price: z.string().transform((val) => {
        return String(val).replace(/[^\d.,]/g, '').replace(',', '.')
    }),
    quantity: (schema) => schema.min(1, {
        message: "Quantidade deve ser maior que 0.",
    }),
});