import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/para_db';
const client = postgres(connectionString);
export const db = drizzle(client, { schema });

export type Item = typeof schema.items.$inferSelect;
export type Status = typeof schema.statuses.$inferSelect;
export type ItemRelation = typeof schema.itemRelations.$inferSelect;
export type Note = typeof schema.notes.$inferSelect;

export type NewItem = typeof schema.items.$inferInsert;
export type NewStatus = typeof schema.statuses.$inferInsert;
export type NewItemRelation = typeof schema.itemRelations.$inferInsert;
export type NewNote = typeof schema.notes.$inferInsert;
