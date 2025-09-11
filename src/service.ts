import { eq, and, or, ilike, asc, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db, Item, Status, ItemRelation, Note } from './db';
import { items, statuses, itemRelations, notes, customFields, bucketFields } from './schema';
import { CreateItemInput, CreateRelationInput, CreateNoteInput, BucketType } from './types';

export class PARAService {
  private db = db;

  async getAllStatuses(): Promise<Status[]> {
    return this.db.select().from(statuses).orderBy(statuses.bucket, statuses.order);
  }

  async createItem(input: CreateItemInput): Promise<Item> {
    // Get status
    const statusQuery = input.statusName 
      ? db.select().from(statuses).where(and(eq(statuses.bucket, input.bucket), eq(statuses.name, input.statusName)))
      : db.select().from(statuses).where(eq(statuses.bucket, input.bucket)).limit(1);
    
    const statusResult = await statusQuery;
    const status = statusResult[0];

    if (!status) {
      throw new Error(`No status found for bucket ${input.bucket}`);
    }

    const result = await db.insert(items).values({
      bucket: input.bucket,
      title: input.title,
      description: input.description,
      statusId: status.id,
      extraFields: input.extraFields || {},
      tags: input.tags || []
    }).returning();

    return result[0];
  }

  async getAllItems(): Promise<Item[]> {
    return this.db.select({
      id: items.id,
      bucket: items.bucket,
      statusId: items.statusId,
      title: items.title,
      description: items.description,
      extraFields: items.extraFields,
      tags: items.tags,
      embedding: items.embedding,
      createdAt: items.createdAt,
      updatedAt: items.updatedAt,
      status: statuses.name
    })
    .from(items)
    .leftJoin(statuses, eq(items.statusId, statuses.id));
  }

  async updateItem(id: string, data: any) {
    console.log('updateItem called with:', { id, data })
    
    const updateData: any = {}
    
    // Only include valid database columns
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.extraFields !== undefined) updateData.extraFields = data.extraFields
    if (data.tags !== undefined) updateData.tags = data.tags
    if (data.bucket !== undefined) updateData.bucket = data.bucket
    
    // Handle status - convert status name to statusId
    if (data.status !== undefined) {
      // First get the current item to know its bucket
      const currentItem = await this.db.query.items.findFirst({
        where: eq(items.id, id)
      })
      
      if (currentItem) {
        // Use the new bucket if provided, otherwise use current bucket
        const bucket = data.bucket || currentItem.bucket
        
        // Find the status ID for the given status name and bucket
        const statusRecord = await this.db.query.statuses.findFirst({
          where: and(
            eq(statuses.name, data.status),
            eq(statuses.bucket, bucket)
          )
        })
        
        if (statusRecord) {
          updateData.statusId = statusRecord.id
        }
      }
    }
    
    console.log('updateData prepared:', updateData)
    
    try {
      await this.db.update(items).set(updateData).where(eq(items.id, id));
      console.log('Update successful')
    } catch (error) {
      console.error('Update failed:', error)
      throw error
    }
  }

  async deleteItem(id: string) {
    await this.db.delete(items).where(eq(items.id, id));
  }

  async getCustomFields(): Promise<any[]> {
    return this.db.select({
      id: customFields.id,
      name: customFields.name,
      label: customFields.label,
      type: customFields.type,
      description: customFields.description,
      defaultValue: customFields.defaultValue,
      arrayOptions: customFields.arrayOptions,
      multiSelect: customFields.multiSelect,
      createdAt: customFields.createdAt,
      updatedAt: customFields.updatedAt
    }).from(customFields).orderBy(asc(customFields.name));
  }

  async createCustomField(input: any): Promise<any> {
    const result = await this.db.insert(customFields).values({
      name: input.name,
      label: input.label,
      type: input.type,
      description: input.description,
      defaultValue: input.defaultValue,
      arrayOptions: input.arrayOptions,
      multiSelect: input.multiSelect
    }).returning();
    
    return result[0];
  }

  async updateCustomField(id: string, input: any): Promise<any> {
    const result = await this.db.update(customFields)
      .set({
        name: input.name,
        label: input.label,
        type: input.type,
        description: input.description,
        defaultValue: input.defaultValue,
        arrayOptions: input.arrayOptions,
        multiSelect: input.multiSelect
      })
      .where(eq(customFields.id, id))
      .returning();
    
    return result[0];
  }

  async deleteCustomField(id: string): Promise<void> {
    // First remove from bucket assignments
    await this.db.delete(bucketFields).where(eq(bucketFields.fieldId, id));
    
    // Then delete the custom field
    await this.db.delete(customFields).where(eq(customFields.id, id));
  }

  async getBucketFields(bucket: BucketType): Promise<any[]> {
    return this.db.select({
      id: customFields.id,
      name: customFields.name,
      label: customFields.label,
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

  async assignFieldToBucket(customFieldId: string, bucketType: string, required: boolean = false) {
    const result = await this.db.insert(bucketFields).values({
      bucket: bucketType as BucketType,
      fieldId: customFieldId,
      required
    }).returning();
    return result[0];
  }

  async removeFieldFromBucket(customFieldId: string, bucketType: string) {
    await this.db.delete(bucketFields)
      .where(
        and(
          eq(bucketFields.fieldId, customFieldId),
          eq(bucketFields.bucket, bucketType as BucketType)
        )
      );
  }

  // Relationship methods
  async addRelationship(input: CreateRelationInput): Promise<ItemRelation> {
    const result = await this.db.insert(itemRelations).values({
      parentId: input.parentId,
      childId: input.childId,
      relationship: input.relationship
    }).returning();
    
    return result[0];
  }

  async removeRelationship(parentId: string, childId: string): Promise<void> {
    await this.db.delete(itemRelations)
      .where(and(
        eq(itemRelations.parentId, parentId),
        eq(itemRelations.childId, childId)
      ));
  }

  async removeRelationshipById(relationshipId: string): Promise<void> {
    await this.db.delete(itemRelations)
      .where(eq(itemRelations.id, relationshipId));
  }

  async getItemRelationships(itemId: string): Promise<any[]> {
    const parentItems = alias(items, 'parentItems');
    const childItems = alias(items, 'childItems');
    
    return this.db.select({
      id: itemRelations.id,
      parentId: itemRelations.parentId,
      childId: itemRelations.childId,
      relationship: itemRelations.relationship,
      parentTitle: parentItems.title,
      parentBucket: parentItems.bucket,
      childTitle: childItems.title,
      childBucket: childItems.bucket
    })
    .from(itemRelations)
    .leftJoin(parentItems, eq(itemRelations.parentId, parentItems.id))
    .leftJoin(childItems, eq(itemRelations.childId, childItems.id))
    .where(or(
      eq(itemRelations.parentId, itemId),
      eq(itemRelations.childId, itemId)
    ));
  }

  // Notes methods
  async getNotes(itemId: string) {
    return await this.db.select().from(notes).where(eq(notes.itemId, itemId)).orderBy(desc(notes.createdAt));
  }

  async createNote(itemId: string, content: string) {
    const [note] = await this.db.insert(notes).values({
      itemId,
      content,
    }).returning();
    return note;
  }

  async updateNote(noteId: string, content: string) {
    const [note] = await this.db.update(notes)
      .set({ content, updatedAt: new Date() })
      .where(eq(notes.id, noteId))
      .returning();
    return note;
  }

  async deleteNote(noteId: string) {
    await this.db.delete(notes).where(eq(notes.id, noteId));
  }

  async getAllNotes() {
    return await this.db.select().from(notes);
  }
}
