import { eq, and, or, ilike, asc } from 'drizzle-orm';
import { db, Item, Status, ItemRelation, Note } from './db';
import { items, statuses, itemRelations, notes, customFields, bucketFields } from './schema';
import { CreateItemInput, CreateRelationInput, CreateNoteInput, BucketType } from './types';

export class PARAService {
  async createItem(input: CreateItemInput): Promise<Item> {
    // Get status
    const statusQuery = input.statusName 
      ? db.select().from(statuses).where(and(eq(statuses.bucket, input.bucket), eq(statuses.name, input.statusName)))
      : db.select().from(statuses).where(eq(statuses.bucket, input.bucket)).orderBy(asc(statuses.order));

    const statusResult = await statusQuery;
    const status = statusResult[0];

    const result = await db.insert(items).values({
      bucket: input.bucket,
      title: input.title,
      description: input.description,
      extraFields: input.extraFields || {},
      statusId: status?.id
    }).returning();

    return result[0];
  }

  async getItemsByBucket(bucket: BucketType, statusName?: string): Promise<Item[]> {
    if (statusName) {
      return db.select({
        id: items.id,
        bucket: items.bucket,
        statusId: items.statusId,
        title: items.title,
        description: items.description,
        extraFields: items.extraFields,
        embedding: items.embedding,
        createdAt: items.createdAt,
        updatedAt: items.updatedAt
      })
      .from(items)
      .innerJoin(statuses, eq(items.statusId, statuses.id))
      .where(and(eq(items.bucket, bucket), eq(statuses.name, statusName)));
    }

    return db.select().from(items).where(eq(items.bucket, bucket));
  }

  async addRelationship(input: CreateRelationInput): Promise<ItemRelation> {
    const result = await db.insert(itemRelations).values(input).returning();
    return result[0];
  }

  async getRelatedItems(itemId: string, relationship?: string): Promise<any[]> {
    const baseQuery = db.select({
      id: items.id,
      bucket: items.bucket,
      statusId: items.statusId,
      title: items.title,
      description: items.description,
      extraFields: items.extraFields,
      embedding: items.embedding,
      createdAt: items.createdAt,
      updatedAt: items.updatedAt,
      relationshipType: itemRelations.relationship
    })
    .from(itemRelations)
    .innerJoin(items, eq(itemRelations.childId, items.id));

    if (relationship) {
      return baseQuery.where(and(eq(itemRelations.parentId, itemId), eq(itemRelations.relationship, relationship)));
    }

    return baseQuery.where(eq(itemRelations.parentId, itemId));
  }

  async addNote(input: CreateNoteInput): Promise<Note> {
    const result = await db.insert(notes).values({
      itemId: input.itemId,
      content: input.content,
      tags: input.tags || []
    }).returning();

    return result[0];
  }

  async getItemNotes(itemId: string): Promise<Note[]> {
    return db.select().from(notes).where(eq(notes.itemId, itemId));
  }

  async searchItems(query: string, bucket?: BucketType): Promise<Item[]> {
    const searchConditions = or(
      ilike(items.title, `%${query}%`),
      ilike(items.description, `%${query}%`)
    );

    if (bucket) {
      return db.select().from(items).where(and(eq(items.bucket, bucket), searchConditions));
    }

    return db.select().from(items).where(searchConditions);
  }

  async updateItemStatus(itemId: string, statusName: string): Promise<Item> {
    const item = await db.select().from(items).where(eq(items.id, itemId));
    if (!item[0]) throw new Error('Item not found');

    const status = await db.select().from(statuses)
      .where(and(eq(statuses.bucket, item[0].bucket), eq(statuses.name, statusName)));
    
    if (!status[0]) throw new Error(`Status '${statusName}' not found for bucket '${item[0].bucket}'`);

    const result = await db.update(items)
      .set({ statusId: status[0].id })
      .where(eq(items.id, itemId))
      .returning();

    return result[0];
  }

  async getCustomFields(): Promise<any[]> {
    return db.query.customFields.findMany();
  }

  async createCustomField(input: { 
    name: string; 
    type: string; 
    description?: string; 
    defaultValue?: any; 
    arrayOptions?: string[]; 
    multiSelect?: boolean; 
  }): Promise<any> {
    const result = await db.insert(customFields).values({
      name: input.name,
      type: input.type as any,
      description: input.description,
      defaultValue: input.defaultValue,
      arrayOptions: input.arrayOptions,
      multiSelect: input.multiSelect
    }).returning();
    return result[0];
  }

  async getBucketFields(bucket: BucketType): Promise<any[]> {
    return db.select({
      id: customFields.id,
      name: customFields.name,
      type: customFields.type,
      description: customFields.description,
      defaultValue: customFields.defaultValue,
      arrayOptions: customFields.arrayOptions,
      multiSelect: customFields.multiSelect,
      required: bucketFields.required
    })
    .from(bucketFields)
    .innerJoin(customFields, eq(bucketFields.fieldId, customFields.id))
    .where(eq(bucketFields.bucket, bucket));
  }

  async assignFieldToBucket(input: { bucket: BucketType; fieldId: string; required?: boolean }): Promise<any> {
    const result = await db.insert(bucketFields).values(input).returning();
    return result[0];
  }
}
