# PARA Knowledge & Task Management System

A comprehensive TypeScript/Drizzle implementation of the PARA method with customizable statuses, arbitrary fields, semantic search capabilities, and advanced relationship management.

## 🌟 Features

### Core PARA Buckets
- **Projects**: Short-term efforts with specific outcomes
- **Areas**: Ongoing responsibilities to maintain
- **Resources**: Reference materials for future use
- **Archives**: Inactive items from other buckets
- **Actions**: Individual actionable tasks and next steps

### Advanced Capabilities
- **Customizable Statuses** per bucket type
- **Typed Custom Fields** with default values and validation
- **1-to-Many Relationships** between items across buckets
- **Rich Notes** with tagging support
- **Parent-Child Visualization** in UI
- **Vector Embeddings** for semantic search (requires pgvector)
- **Multi-Select Dropdowns** for array fields
- **Cross-Bucket Navigation** and relationship management

### View Options
- **Kanban**: Drag-and-drop cards between status columns
- **List**: Detailed table view with inline editing
- **By Priority**: Group items by priority level
- **By Energy**: Organize tasks by energy requirement
- **By Status**: Group items by their current status
- **By Tags**: Filter and group items by tags
- **Timeline**: Calendar-based view for scheduled items
- **Graph**: Visual relationship mapping between items

### Smart Relationships
- **Project Context**: Shows associated areas for each project
- **Action Context**: Displays parent projects for each action
- **Bi-directional Navigation**: Easy movement between related items
- **Visual Indicators**: Clear relationship status display

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for local development)
- PostgreSQL with pgvector extension

### Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd para
```

2. **Start with Docker**:
```bash
docker-compose up -d
```

3. **Access the application**:
- Main Interface: http://localhost:3001
- Custom Fields Management: http://localhost:3001/fields

## 🏗️ Architecture

### Database Schema
- `items`: Core entities with bucket, status, and custom fields
- `statuses`: Customizable workflow states per bucket
- `custom_fields`: Reusable field definitions with types and options
- `bucket_fields`: Assignment of fields to specific buckets
- `item_relations`: Many-to-many relationships between items
- `notes`: Rich content attached to items with tags

### Technology Stack
- **Backend**: Node.js, TypeScript, Drizzle ORM
- **Database**: PostgreSQL with pgvector
- **Frontend**: React, Tailwind CSS, shadcn/ui
- **Deployment**: Docker Compose

## 📋 Usage Examples

### Creating Custom Fields
```typescript
// Navigate to /fields page
// Create field: "Priority" (array) with options [low, medium, high]
// Assign to Projects bucket
// Use in "Add New Item" dialog
```

### Managing Relationships
```typescript
const service = new PARAService();

// Create items
const project = await service.createItem({
  bucket: BucketType.PROJECT,
  title: "Website Redesign",
  statusName: "Planning"
});

const action = await service.createItem({
  bucket: BucketType.ACTION,
  title: "Review wireframes",
  statusName: "Next"
});

// Create relationship
await service.addRelationship({
  parentId: project.id,
  childId: action.id,
  relationship: "contains"
});
```

### Custom Field Types
- **Text**: Simple text input with default values
- **Boolean**: Checkbox with true/false states
- **Date**: Date picker with calendar
- **DateTime**: Date and time picker
- **Array**: Single or multi-select dropdowns with predefined options
- **Energy**: High/Medium/Low task energy requirement
- **Priority**: High/Medium/Low task priority

## 🎨 UI Features

### Bucket Visualization
- Color-coded buckets (Projects: Blue, Areas: Green, Resources: Yellow, Archives: Gray, Actions: Red)
- Parent-child relationship display
- Cross-bucket navigation
- Real-time search across all items
- Smart relationship indicators
- Multiple view options for different workflows

### Custom Fields Management
- Dedicated fields management page
- Drag-and-drop field assignment to buckets
- Type-specific input controls
- Default value configuration
- Bulk field operations

### Relationship Management
- Visual parent-child indicators
- "Contains" sections showing child items
- Clickable cross-bucket navigation
- Relationship type display (uses, depends-on, contains, etc.)
- Context-aware relationship display

## 🔧 Development

### Local Development
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database URL

# Generate and push schema
npm run db:generate
npm run db:push

# Seed default data
npx ts-node src/seed.ts

# Start development server
npm run dev
```

### Database Management
```bash
# Reset database
docker-compose down -v
docker-compose up -d

# View logs
docker-compose logs -f app
```

## 📊 Default Configuration

### Pre-configured Fields
- **priority**: Array field with options [low, medium, high]
- **energy**: Array field with options [low, medium, high]
- **deadline**: Date field for due dates
- **isUrgent**: Boolean field for urgency flags
- **tags**: Multi-select array field for categorization
- **estimatedHours**: Text field for time estimates

### Default Assignments
- **Projects**: priority, energy, deadline, estimatedHours
- **Actions**: priority, energy, isUrgent, deadline

### Status Workflows
- **Projects**: Planning → In Progress → On Hold → Completed
- **Areas**: Active → Needs Attention → Maintaining
- **Resources**: Available → In Use → Outdated
- **Archives**: Archived
- **Actions**: Next → Waiting → Someday → Done

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- [PARA Method](https://fortelabs.co/blog/para/) by Tiago Forte
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [pgvector Extension](https://github.com/pgvector/pgvector)
