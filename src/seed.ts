import { db } from './db';
import { statuses } from './schema';
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
}

seed().catch(console.error);
