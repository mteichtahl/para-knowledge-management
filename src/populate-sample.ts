import { PARAService } from './service';
import { BucketType } from './types';

const service = new PARAService();

async function populateSampleData() {
  console.log('Populating database with sample data...');

  try {
    // PROJECTS
    await service.createItem({
      bucket: BucketType.PROJECT,
      title: 'Website Redesign',
      description: 'Complete overhaul of company website with modern design and improved UX',
      statusName: 'In Progress',
      extraFields: {
        priority: 'High',
        energy: 'High',
        startDate: '2025-01-15',
        endDate: '2025-03-30',
        owner: 'Sarah Chen',
        email: 'sarah.chen@company.com'
      }
    });

    await service.createItem({
      bucket: BucketType.PROJECT,
      title: 'Mobile App Launch',
      description: 'Develop and launch iOS/Android app for customer engagement',
      statusName: 'Next Up',
      extraFields: {
        priority: 'High',
        energy: 'Medium',
        startDate: '2025-02-01',
        endDate: '2025-06-15',
        owner: 'Mike Rodriguez',
        email: 'mike.rodriguez@company.com'
      }
    });

    // AREAS
    await service.createItem({
      bucket: BucketType.AREA,
      title: 'Customer Support Excellence',
      description: 'Maintain high-quality customer support with <2hr response time',
      statusName: 'In Progress',
      extraFields: {
        priority: 'High',
        energy: 'Medium',
        owner: 'Jennifer Walsh'
      }
    });

    // ACTIONS
    await service.createItem({
      bucket: BucketType.ACTION,
      title: 'Review wireframes for homepage',
      description: 'Provide feedback on new homepage wireframes from design team',
      statusName: 'Next Up',
      extraFields: {
        priority: 'High',
        energy: 'Low',
        endDate: '2025-01-25',
        owner: 'Sarah Chen'
      }
    });

    // RESOURCES
    await service.createItem({
      bucket: BucketType.RESOURCE,
      title: 'UX Design Best Practices',
      description: 'Collection of articles, tools, and guidelines for user experience design',
      statusName: 'In Progress',
      extraFields: {
        link: 'https://uxdesign.cc/best-practices',
        owner: 'Sarah Chen'
      }
    });

    // ARCHIVES
    await service.createItem({
      bucket: BucketType.ARCHIVE,
      title: 'Q4 2024 Marketing Campaign',
      description: 'Holiday season marketing campaign - completed successfully',
      statusName: 'In Progress',
      extraFields: {
        priority: 'High',
        startDate: '2024-10-01',
        endDate: '2024-12-31',
        owner: 'Marketing Team'
      }
    });

    console.log('Sample data populated successfully!');
  } catch (error) {
    console.error('Error populating sample data:', error);
  }
}

populateSampleData().catch(console.error);
