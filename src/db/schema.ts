import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";
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
    price: int().notNull(),
    quantity: int().notNull(),
    imageUrl: text(),

    createdAt: int().notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: int().notNull().default(sql`CURRENT_TIMESTAMP`),
    isActive: int().notNull().default(1),
    order: int().notNull().default(0),
});


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