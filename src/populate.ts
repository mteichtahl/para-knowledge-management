import { PARAService } from './service';
import { BucketType } from './types';

const service = new PARAService();

const projects = [
  { title: "Website Redesign", description: "Complete overhaul of company website with modern design", priority: "High", urgency: "Medium" },
  { title: "Mobile App Development", description: "Build native iOS and Android apps", priority: "High", urgency: "High" },
  { title: "Customer Portal", description: "Self-service portal for customer account management", priority: "Medium", urgency: "Medium" },
  { title: "API Documentation", description: "Comprehensive API docs for developers", priority: "Medium", urgency: "Low" },
  { title: "Security Audit", description: "Third-party security assessment and remediation", priority: "High", urgency: "High" },
  { title: "Database Migration", description: "Migrate from MySQL to PostgreSQL", priority: "High", urgency: "Medium" },
  { title: "Marketing Campaign Q2", description: "Launch new product marketing campaign", priority: "Medium", urgency: "Medium" },
  { title: "Employee Training Program", description: "Develop comprehensive onboarding program", priority: "Medium", urgency: "Low" },
  { title: "Cloud Infrastructure", description: "Migrate to AWS cloud infrastructure", priority: "High", urgency: "Medium" },
  { title: "Performance Optimization", description: "Optimize application performance and load times", priority: "Medium", urgency: "Medium" },
  { title: "Compliance Framework", description: "Implement GDPR and SOC2 compliance", priority: "High", urgency: "High" },
  { title: "Analytics Dashboard", description: "Build executive analytics dashboard", priority: "Medium", urgency: "Low" },
  { title: "Inventory Management", description: "New inventory tracking system", priority: "Medium", urgency: "Medium" },
  { title: "Customer Feedback System", description: "Automated feedback collection and analysis", priority: "Low", urgency: "Low" },
  { title: "Legacy System Cleanup", description: "Decommission old systems and migrate data", priority: "Low", urgency: "Low" },
  { title: "Backup Strategy", description: "Implement comprehensive backup and recovery", priority: "High", urgency: "Medium" },
  { title: "Team Collaboration Tools", description: "Deploy new collaboration platform", priority: "Medium", urgency: "Medium" },
  { title: "Quality Assurance Process", description: "Establish QA testing procedures", priority: "Medium", urgency: "Medium" },
  { title: "Vendor Management System", description: "Centralized vendor relationship management", priority: "Low", urgency: "Low" },
  { title: "Knowledge Base", description: "Internal knowledge sharing platform", priority: "Medium", urgency: "Low" }
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
  { title: "Review wireframes", description: "Review new UI wireframes from design team", priority: "High", urgency: "High" },
  { title: "Update documentation", description: "Update API documentation with latest changes", priority: "Medium", urgency: "Medium" },
  { title: "Schedule team meeting", description: "Schedule weekly team standup meeting", priority: "Medium", urgency: "Medium" },
  { title: "Code review PR #123", description: "Review pull request for authentication module", priority: "High", urgency: "High" },
  { title: "Deploy to staging", description: "Deploy latest build to staging environment", priority: "High", urgency: "Medium" },
  { title: "Update dependencies", description: "Update npm packages to latest versions", priority: "Low", urgency: "Low" },
  { title: "Write unit tests", description: "Add unit tests for payment processing", priority: "Medium", urgency: "Medium" },
  { title: "Client presentation", description: "Prepare presentation for client meeting", priority: "High", urgency: "High" },
  { title: "Database backup", description: "Perform weekly database backup", priority: "High", urgency: "Medium" },
  { title: "Security scan", description: "Run security vulnerability scan", priority: "Medium", urgency: "Medium" },
  { title: "Performance testing", description: "Load test new features", priority: "Medium", urgency: "Low" },
  { title: "Bug triage", description: "Triage and prioritize reported bugs", priority: "High", urgency: "Medium" }
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
      extraFields: { priority: project.priority, urgency: project.urgency }
    });
  }

  // Create areas
  console.log('Creating areas...');
  for (const area of areas) {
    await service.createItem({
      bucket: BucketType.AREA,
      title: area.title,
      description: area.description,
      statusName: 'Active',
      extraFields: { priority: 'Medium', urgency: 'Medium' }
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
      extraFields: { priority: action.priority, urgency: action.urgency }
    });
  }

  // Create resources
  console.log('Creating resources...');
  for (const resource of resources) {
    await service.createItem({
      bucket: BucketType.RESOURCE,
      title: resource.title,
      description: resource.description,
      statusName: 'Available',
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
  process.exit(0);
}

populateDatabase().catch(console.error);
