import { eq, and, or, ilike, asc } from 'drizzle-orm';
import { db, Item, Status, ItemRelation, Note } from './db';
import { items, statuses, itemRelations, notes, customFields, bucketFields } from './schema';
import { CreateItemInput, CreateRelationInput, CreateNoteInput, BucketType } from './types';

export class PARAService {
  private db = db;

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
      extraFields: input.extraFields || {}
    }).returning();

    return result[0];
  }

  async getAllItems(): Promise<Item[]> {
    return this.db.select().from(items);
  }

  async updateItem(id: string, data: any) {
    await this.db.update(items).set(data).where(eq(items.id, id));
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
}
