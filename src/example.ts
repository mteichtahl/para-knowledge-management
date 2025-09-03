import { PARAService } from './service';
import { BucketType } from './types';

const service = new PARAService();

async function demoPARASystem() {
  try {
    // Create a project
    const project = await service.createItem({
      bucket: BucketType.PROJECT,
      title: "Launch new website",
      description: "Complete redesign and launch of company website",
      extraFields: { deadline: "2024-03-15", priority: "high" }
    });
    console.log(`Created project: ${project.title}`);

    // Create related resources
    const resource1 = await service.createItem({
      bucket: BucketType.RESOURCE,
      title: "Design system documentation",
      description: "Brand guidelines and UI components"
    });

    const resource2 = await service.createItem({
      bucket: BucketType.RESOURCE,
      title: "Content strategy guide",
      description: "Messaging and content guidelines"
    });

    // Link resources to project
    await service.addRelationship({
      parentId: project.id,
      childId: resource1.id,
      relationship: "uses-resource"
    });

    await service.addRelationship({
      parentId: project.id,
      childId: resource2.id,
      relationship: "uses-resource"
    });

    // Add notes to project
    await service.addNote({
      itemId: project.id,
      content: "Initial meeting notes: Focus on mobile-first design, accessibility compliance",
      tags: ["meeting", "requirements"]
    });

    // Create area for ongoing responsibility
    const area = await service.createItem({
      bucket: BucketType.AREA,
      title: "Website maintenance",
      description: "Ongoing updates and security patches",
      extraFields: { reviewFrequency: "monthly" }
    });

    // Update project status
    await service.updateItemStatus(project.id, "In Progress");

    // Query examples
    console.log("\nActive projects:");
    const activeProjects = await service.getItemsByBucket(BucketType.PROJECT, "In Progress");
    activeProjects.forEach(p => console.log(`- ${p.title}`));

    console.log(`\nResources linked to '${project.title}':`);
    const linkedResources = await service.getRelatedItems(project.id, "uses-resource");
    linkedResources.forEach(r => console.log(`- ${r.title}`));

    console.log("\nSearch for 'design':");
    const searchResults = await service.searchItems("design");
    searchResults.forEach(item => console.log(`- ${item.title} (${item.bucket})`));

  } catch (error) {
    console.error('Error:', error);
  }
}

demoPARASystem();
