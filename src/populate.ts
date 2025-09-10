import { PARAService } from './service';
import { BucketType } from './types';

const service = new PARAService();

async function populate() {
  console.log('Populate script ready - add your own data here');
  // Add your own items here as needed
  
  // Example:
  // await service.createItem({
  //   bucket: BucketType.PROJECT,
  //   title: 'My Project',
  //   description: 'Project description',
  //   statusName: 'Planning',
  //   extraFields: { priority: 'High' }
  // });
}

populate().catch(console.error);
