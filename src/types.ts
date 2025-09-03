export enum BucketType {
  PROJECT = 'PROJECT',
  AREA = 'AREA',
  RESOURCE = 'RESOURCE',
  ARCHIVE = 'ARCHIVE',
  ACTION = 'ACTION'
}

export interface CreateItemInput {
  bucket: BucketType;
  title: string;
  statusName?: string;
  description?: string;
  extraFields?: Record<string, any>;
}

export interface CreateRelationInput {
  parentId: string;
  childId: string;
  relationship: string;
}

export interface CreateNoteInput {
  itemId: string;
  content: string;
  tags?: string[];
}
