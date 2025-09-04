import { pgTable, uuid, text, integer, timestamp, json, pgEnum, unique, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const bucketTypeEnum = pgEnum('bucket_type', ['PROJECT', 'AREA', 'RESOURCE', 'ARCHIVE', 'ACTION']);
export const fieldTypeEnum = pgEnum('field_type', ['text', 'email', 'boolean', 'array', 'date', 'datetime']);

export const customFields = pgTable('custom_fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  label: text('label'),
  type: fieldTypeEnum('type').notNull(),
  description: text('description'),
  defaultValue: json('default_value'),
  arrayOptions: text('array_options').array(),
  multiSelect: boolean('multi_select').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const bucketFields = pgTable('bucket_fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  bucket: bucketTypeEnum('bucket').notNull(),
  fieldId: uuid('field_id').references(() => customFields.id, { onDelete: 'cascade' }).notNull(),
  required: boolean('required').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  bucketFieldUnique: unique().on(table.bucket, table.fieldId)
}));

export const statuses = pgTable('statuses', {
  id: uuid('id').primaryKey().defaultRandom(),
  bucket: bucketTypeEnum('bucket').notNull(),
  name: text('name').notNull(),
  color: text('color'),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  bucketNameUnique: unique().on(table.bucket, table.name)
}));

export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  bucket: bucketTypeEnum('bucket').notNull(),
  statusId: uuid('status_id').references(() => statuses.id),
  title: text('title').notNull(),
  description: text('description'),
  extraFields: json('extra_fields').default({}).notNull(),
  embedding: text('embedding'), // Vector type for pgvector
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const itemRelations = pgTable('item_relations', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentId: uuid('parent_id').references(() => items.id, { onDelete: 'cascade' }).notNull(),
  childId: uuid('child_id').references(() => items.id, { onDelete: 'cascade' }).notNull(),
  relationship: text('relationship').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  relationshipUnique: unique().on(table.parentId, table.childId, table.relationship)
}));

export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id').references(() => items.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  tags: text('tags').array(),
  embedding: text('embedding'), // Vector type for pgvector
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const statusesRelations = relations(statuses, ({ many }) => ({
  items: many(items)
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  status: one(statuses, {
    fields: [items.statusId],
    references: [statuses.id]
  }),
  notes: many(notes),
  parentRelations: many(itemRelations, { relationName: 'parent' }),
  childRelations: many(itemRelations, { relationName: 'child' })
}));

export const itemRelationsRelations = relations(itemRelations, ({ one }) => ({
  parent: one(items, {
    fields: [itemRelations.parentId],
    references: [items.id],
    relationName: 'parent'
  }),
  child: one(items, {
    fields: [itemRelations.childId],
    references: [items.id],
    relationName: 'child'
  })
}));

export const notesRelations = relations(notes, ({ one }) => ({
  item: one(items, {
    fields: [notes.itemId],
    references: [items.id]
  })
}));
