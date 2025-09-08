import { PARAService } from './service';
import { BucketType } from './types';

const service = new PARAService();

const projects = [
  { title: "Website Redesign", description: "Complete overhaul of company website with modern design", priority: "High", energy: "Medium" },
  { title: "Mobile App Development", description: "Build native iOS and Android apps", priority: "High", energy: "High" },
  { title: "Customer Portal", description: "Self-service portal for customer account management", priority: "Medium", energy: "Medium" },
  { title: "API Documentation", description: "Comprehensive API docs for developers", priority: "Medium", energy: "Low" },
  { title: "Security Audit", description: "Third-party security assessment and remediation", priority: "High", energy: "High" },
  { title: "Database Migration", description: "Migrate from MySQL to PostgreSQL", priority: "High", energy: "Medium" },
  { title: "Marketing Campaign Q2", description: "Launch new product marketing campaign", priority: "Medium", energy: "Medium" },
  { title: "Employee Training Program", description: "Develop comprehensive onboarding program", priority: "Medium", energy: "Low" },
  { title: "Cloud Infrastructure", description: "Migrate to AWS cloud infrastructure", priority: "High", energy: "Medium" },
  { title: "Performance Optimization", description: "Optimize application performance and load times", priority: "Medium", energy: "Medium" },
  { title: "Compliance Framework", description: "Implement GDPR and SOC2 compliance", priority: "High", energy: "High" },
  { title: "Analytics Dashboard", description: "Build executive analytics dashboard", priority: "Medium", energy: "Low" },
  { title: "Inventory Management", description: "New inventory tracking system", priority: "Medium", energy: "Medium" },
  { title: "Customer Feedback System", description: "Automated feedback collection and analysis", priority: "Low", energy: "Low" },
  { title: "Legacy System Cleanup", description: "Decommission old systems and migrate data", priority: "Low", energy: "Low" },
  { title: "Backup Strategy", description: "Implement comprehensive backup and recovery", priority: "High", energy: "Medium" },
  { title: "Team Collaboration Tools", description: "Deploy new collaboration platform", priority: "Medium", energy: "Medium" },
  { title: "Quality Assurance Process", description: "Establish QA testing procedures", priority: "Medium", energy: "Medium" },
  { title: "Vendor Management System", description: "Centralized vendor relationship management", priority: "Low", energy: "Low" },
  { title: "Knowledge Base", description: "Internal knowledge sharing platform", priority: "Medium", energy: "Low" }
];

const areas = [
  { title: "Team Management", description: "Managing development team and resources" },
  { title: "Budget Planning", description: "Annual budget planning and tracking" },
  { title: "Client Relations", description: "Maintaining relationships with key clients" },
  { title: "Product Strategy", description: "Long-term product roadmap and vision" },
  { title: "Quality Assurance", description: "Ensuring product quality standards" },
  { title: "Security Operations", description: "Ongoing security monitoring and maintenance" },
  { title: "Infrastructure Maintenance", description: "Server and system maintenance" },
  { title: "Vendor Relationships", description: "Managing third-party vendor contracts" }
];

const actions = [
  { title: "Review wireframes", description: "Review new UI wireframes from design team", priority: "High", energy: "High" },
  { title: "Update documentation", description: "Update API documentation with latest changes", priority: "Medium", energy: "Medium" },
  { title: "Schedule team meeting", description: "Schedule weekly team standup meeting", priority: "Medium", energy: "Medium" },
  { title: "Code review PR #123", description: "Review pull request for authentication module", priority: "High", energy: "High" },
  { title: "Deploy to staging", description: "Deploy latest build to staging environment", priority: "High", energy: "Medium" },
  { title: "Update dependencies", description: "Update npm packages to latest versions", priority: "Low", energy: "Low" },
  { title: "Write unit tests", description: "Add unit tests for payment processing", priority: "Medium", energy: "Medium" },
  { title: "Client presentation", description: "Prepare presentation for client meeting", priority: "High", energy: "High" },
  { title: "Database backup", description: "Perform weekly database backup", priority: "High", energy: "Medium" },
  { title: "Security scan", description: "Run security vulnerability scan", priority: "Medium", energy: "Medium" },
  { title: "Performance testing", description: "Load test new features", priority: "Medium", energy: "Low" },
  { title: "Bug triage", description: "Triage and prioritize reported bugs", priority: "High", energy: "Medium" }
];

const resources = [
  { title: "React Documentation", description: "Official React.js documentation and guides" },
  { title: "AWS Best Practices", description: "AWS architecture and security best practices" },
  { title: "Design System", description: "Company design system and component library" },
  { title: "API Reference", description: "Internal API reference documentation" },
  { title: "Security Guidelines", description: "Security policies and implementation guidelines" },
  { title: "Coding Standards", description: "Team coding standards and style guide" },
  { title: "Database Schema", description: "Current database schema documentation" },
  { title: "Deployment Guide", description: "Step-by-step deployment procedures" },
  { title: "Troubleshooting Guide", description: "Common issues and solutions" },
  { title: "Vendor Contacts", description: "List of vendor contacts and support info" }
];

const archives = [
  { title: "Old Website", description: "Previous company website (archived 2023)" },
  { title: "Legacy CRM", description: "Old customer relationship management system" },
  { title: "Q1 Marketing Campaign", description: "Completed Q1 2024 marketing materials" },
  { title: "Old API v1", description: "Deprecated API version 1 documentation" },
  { title: "Previous Branding", description: "Old brand guidelines and assets" },
  { title: "Completed Training", description: "2023 employee training materials" },
  { title: "Old Infrastructure", description: "Previous server setup documentation" },
  { title: "Retired Features", description: "Documentation for removed product features" }
];

async function populateDatabase() {
  console.log('Populating database with sample data...');

  // Create projects
  console.log('Creating projects...');
  for (const project of projects) {
    await service.createItem({
      bucket: BucketType.PROJECT,
      title: project.title,
      description: project.description,
      statusName: 'Next Up',
      extraFields: { priority: project.priority, energy: project.energy }
    });
  }

  // Create areas
  console.log('Creating areas...');
  for (const area of areas) {
    await service.createItem({
      bucket: BucketType.AREA,
      title: area.title,
      description: area.description,
      statusName: 'Next Up',
      extraFields: { priority: 'Medium', energy: 'Medium' }
    });
  }

  // Create actions
  console.log('Creating actions...');
  for (const action of actions) {
    await service.createItem({
      bucket: BucketType.ACTION,
      title: action.title,
      description: action.description,
      statusName: 'Next Up',
      extraFields: { priority: action.priority, energy: action.energy }
    });
  }

  // Create resources
  console.log('Creating resources...');
  for (const resource of resources) {
    await service.createItem({
      bucket: BucketType.RESOURCE,
      title: resource.title,
      description: resource.description,
      statusName: 'Next Up',
      extraFields: {}
    });
  }

  // Create archives
  console.log('Creating archives...');
  for (const archive of archives) {
    await service.createItem({
      bucket: BucketType.ARCHIVE,
      title: archive.title,
      description: archive.description,
      statusName: 'Next Up',
      extraFields: {}
    });
  }

  console.log('Database populated successfully!');

  // Create comprehensive sample relationships
  console.log('Creating comprehensive sample relationships...');
  
  // Get items by bucket type
  const allItems = await service.getAllItems();
  const projectItems = allItems.filter(item => item.bucket === 'PROJECT');
  const actionItems = allItems.filter(item => item.bucket === 'ACTION');
  const resourceItems = allItems.filter(item => item.bucket === 'RESOURCE');
  const areaItems = allItems.filter(item => item.bucket === 'AREA');
  const archiveItems = allItems.filter(item => item.bucket === 'ARCHIVE');

  // Project 1: Website Redesign - comprehensive relationships
  if (projectItems.length > 0) {
    // Contains multiple actions
    if (actionItems.length >= 3) {
      await service.addRelationship({
        parentId: projectItems[0].id,
        childId: actionItems[0].id,
        relationship: 'contains'
      });
      await service.addRelationship({
        parentId: projectItems[0].id,
        childId: actionItems[1].id,
        relationship: 'contains'
      });
      await service.addRelationship({
        parentId: projectItems[0].id,
        childId: actionItems[2].id,
        relationship: 'contains'
      });
    }
    
    // Uses multiple resources
    if (resourceItems.length >= 2) {
      await service.addRelationship({
        parentId: projectItems[0].id,
        childId: resourceItems[0].id,
        relationship: 'uses'
      });
      await service.addRelationship({
        parentId: projectItems[0].id,
        childId: resourceItems[1].id,
        relationship: 'uses'
      });
    }
    
    // Depends on area
    if (areaItems.length > 0) {
      await service.addRelationship({
        parentId: projectItems[0].id,
        childId: areaItems[0].id,
        relationship: 'depends-on'
      });
    }
  }

  // Project 2: Mobile App Development - different relationships
  if (projectItems.length > 1) {
    // Contains actions
    if (actionItems.length >= 5) {
      await service.addRelationship({
        parentId: projectItems[1].id,
        childId: actionItems[3].id,
        relationship: 'contains'
      });
      await service.addRelationship({
        parentId: projectItems[1].id,
        childId: actionItems[4].id,
        relationship: 'contains'
      });
    }
    
    // Uses resources
    if (resourceItems.length >= 4) {
      await service.addRelationship({
        parentId: projectItems[1].id,
        childId: resourceItems[2].id,
        relationship: 'uses'
      });
      await service.addRelationship({
        parentId: projectItems[1].id,
        childId: resourceItems[3].id,
        relationship: 'uses'
      });
    }
    
    // Depends on multiple areas
    if (areaItems.length >= 2) {
      await service.addRelationship({
        parentId: projectItems[1].id,
        childId: areaItems[1].id,
        relationship: 'depends-on'
      });
    }
  }

  // Area relationships - areas contain projects and actions
  if (areaItems.length > 0 && projectItems.length >= 3) {
    await service.addRelationship({
      parentId: areaItems[0].id,
      childId: projectItems[2].id,
      relationship: 'contains'
    });
  }

  // Resource relationships - resources used by multiple items
  if (resourceItems.length > 0 && actionItems.length >= 7) {
    await service.addRelationship({
      parentId: actionItems[5].id,
      childId: resourceItems[0].id,
      relationship: 'uses'
    });
    await service.addRelationship({
      parentId: actionItems[6].id,
      childId: resourceItems[0].id,
      relationship: 'uses'
    });
  }

  // Archive relationships - archived items reference active ones
  if (archiveItems.length > 0 && projectItems.length >= 4) {
    await service.addRelationship({
      parentId: archiveItems[0].id,
      childId: projectItems[3].id,
      relationship: 'references'
    });
  }

  console.log('Comprehensive sample relationships created!');
  process.exit(0);
}

populateDatabase().catch(console.error);
