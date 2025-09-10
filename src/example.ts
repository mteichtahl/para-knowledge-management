import { PARAService } from './service';
import { BucketType } from './types';

const service = new PARAService();

async function exampleUsage() {
  try {
    console.log('PARA Service example usage');
    
    // Example: Create an item
    // const item = await service.createItem({
    //   bucket: BucketType.PROJECT,
    //   title: "My Project",
    //   description: "Project description",
    //   extraFields: { priority: "high" }
    // });
    
    // Example: Add a relationship
    // await service.addRelationship({
    //   parentId: item.id,
    //   childId: otherItem.id,
    //   relationship: "contains"
    // });
    
    // Example: Add a note
    // await service.addNote({
    //   itemId: item.id,
    //   content: "My note content",
    //   tags: ["important"]
    // });

  } catch (error) {
    console.error('Error:', error);
  }
}

exampleUsage();
