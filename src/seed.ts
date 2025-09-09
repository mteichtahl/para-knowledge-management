import { db } from './db';
import { statuses, customFields, bucketFields } from './schema';
import { BucketType } from './types';

async function seed() {
  const defaultStatuses = [
    // Projects
    { bucket: BucketType.PROJECT, name: 'Planning', order: 1 },
    { bucket: BucketType.PROJECT, name: 'In Progress', order: 2 },
    { bucket: BucketType.PROJECT, name: 'On Hold', order: 3 },
    { bucket: BucketType.PROJECT, name: 'Completed', order: 4 },
    
    // Areas
    { bucket: BucketType.AREA, name: 'Active', order: 1 },
    { bucket: BucketType.AREA, name: 'Needs Attention', order: 2 },
    { bucket: BucketType.AREA, name: 'Maintaining', order: 3 },
    
    // Resources
    { bucket: BucketType.RESOURCE, name: 'Available', order: 1 },
    { bucket: BucketType.RESOURCE, name: 'In Use', order: 2 },
    { bucket: BucketType.RESOURCE, name: 'Outdated', order: 3 },
    
    // Archive
    { bucket: BucketType.ARCHIVE, name: 'Archived', order: 1 }
  ];

  await db.insert(statuses).values(defaultStatuses).onConflictDoNothing();
  console.log('Seeded default statuses');

  // Create URL custom field for Resources
  const urlField = await db.insert(customFields).values({
    name: 'url',
    label: 'URL',
    type: 'url',
    description: 'Web link or reference URL for this resource'
  }).onConflictDoNothing().returning();

  if (urlField.length > 0) {
    await db.insert(bucketFields).values({
      bucket: BucketType.RESOURCE,
      fieldId: urlField[0].id,
      required: false
    }).onConflictDoNothing();
    console.log('Created URL field for Resources');
  }

  // Create Link custom field for Resources
  const linkField = await db.insert(customFields).values({
    name: 'link',
    label: 'Link',
    type: 'url',
    description: 'External link or reference for this resource'
  }).onConflictDoNothing().returning();

  if (linkField.length > 0) {
    await db.insert(bucketFields).values({
      bucket: BucketType.RESOURCE,
      fieldId: linkField[0].id,
      required: false
    }).onConflictDoNothing();
    console.log('Created Link field for Resources');
  }
}

seed().catch(console.error);
