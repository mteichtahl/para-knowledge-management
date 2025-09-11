-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create bucket type enum
CREATE TYPE bucket_type AS ENUM ('PROJECT', 'AREA', 'RESOURCE', 'ARCHIVE', 'ACTION');

-- Create field type enum
CREATE TYPE field_type AS ENUM ('text', 'boolean', 'array', 'date', 'datetime', 'url', 'email');

-- Create custom field definitions table
CREATE TABLE custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    label TEXT,
    type field_type NOT NULL,
    description TEXT,
    default_value JSONB,
    array_options TEXT[],
    multi_select BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create bucket field assignments table
CREATE TABLE bucket_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket bucket_type NOT NULL,
    field_id UUID REFERENCES custom_fields(id) ON DELETE CASCADE NOT NULL,
    required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(bucket, field_id)
);

-- Create statuses table
CREATE TABLE statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket bucket_type NOT NULL,
    name TEXT NOT NULL,
    color TEXT,
    "order" INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(bucket, name)
);

-- Create items table
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket bucket_type NOT NULL,
    status_id UUID REFERENCES statuses(id),
    title TEXT NOT NULL,
    description TEXT,
    extra_fields JSONB DEFAULT '{}' NOT NULL,
    tags TEXT[],
    embedding TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create item_relations table
CREATE TABLE item_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
    child_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
    relationship TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(parent_id, child_id, relationship)
);

-- Create notes table
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[],
    embedding TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Insert default statuses
INSERT INTO statuses (bucket, name, "order") VALUES
-- Projects
('PROJECT', 'Next Up', 1),
('PROJECT', 'In Progress', 2),
('PROJECT', 'In Review', 3),
('PROJECT', 'On Hold', 4),
('PROJECT', 'Wont Do', 5),
('PROJECT', 'Completed', 6),
-- Areas
('AREA', 'Next Up', 1),
('AREA', 'In Progress', 2),
('AREA', 'In Review', 3),
('AREA', 'On Hold', 4),
('AREA', 'Wont Do', 5),
('AREA', 'Completed', 6),
-- Resources
('RESOURCE', 'Next Up', 1),
('RESOURCE', 'In Progress', 2),
('RESOURCE', 'In Review', 3),
('RESOURCE', 'On Hold', 4),
('RESOURCE', 'Wont Do', 5),
('RESOURCE', 'Completed', 6),
-- Archive
('ARCHIVE', 'Next Up', 1),
('ARCHIVE', 'In Progress', 2),
('ARCHIVE', 'In Review', 3),
('ARCHIVE', 'On Hold', 4),
('ARCHIVE', 'Wont Do', 5),
('ARCHIVE', 'Completed', 6),
-- Actions
('ACTION', 'Next Up', 1),
('ACTION', 'In Progress', 2),
('ACTION', 'In Review', 3),
('ACTION', 'On Hold', 4),
('ACTION', 'Wont Do', 5),
('ACTION', 'Completed', 6);

-- Insert priority custom field
INSERT INTO custom_fields (name, label, type, description, default_value, array_options, multi_select) VALUES
('priority', 'Priority', 'array', 'Priority level', '["Medium"]', ARRAY['High', 'Medium', 'Low'], false);

-- Insert energy custom field
INSERT INTO custom_fields (name, label, type, description, default_value, array_options, multi_select) VALUES
('energy', 'Energy', 'array', 'Energy level', '["Medium"]', ARRAY['High', 'Medium', 'Low'], false);

-- Insert start date custom field
INSERT INTO custom_fields (name, label, type, description, default_value, array_options, multi_select) VALUES
('startDate', 'Start Date', 'date', 'Start date', null, null, false);

-- Insert end date custom field
INSERT INTO custom_fields (name, label, type, description, default_value, array_options, multi_select) VALUES
('endDate', 'End Date', 'date', 'End date', null, null, false);

-- Insert owner custom field
INSERT INTO custom_fields (name, label, type, description, default_value, array_options, multi_select) VALUES
('owner', 'Owner', 'text', 'Owner', null, null, false);

-- Insert email custom field
INSERT INTO custom_fields (name, label, type, description, default_value, array_options, multi_select) VALUES
('email', 'Email', 'email', 'Email address', null, null, false);

-- Insert Link custom field for Resources
INSERT INTO custom_fields (name, label, type, description, default_value, array_options, multi_select) VALUES
('link', 'Link', 'url', 'External link or reference for this resource', null, null, false);

-- Assign priority field as required to Projects, Areas, and Actions only
INSERT INTO bucket_fields (bucket, field_id, required) VALUES
('PROJECT', (SELECT id FROM custom_fields WHERE name = 'priority'), true),
('AREA', (SELECT id FROM custom_fields WHERE name = 'priority'), true),
('ACTION', (SELECT id FROM custom_fields WHERE name = 'priority'), true);

-- Assign energy field as required to Projects, Areas, and Actions only
INSERT INTO bucket_fields (bucket, field_id, required) VALUES
('PROJECT', (SELECT id FROM custom_fields WHERE name = 'energy'), true),
('AREA', (SELECT id FROM custom_fields WHERE name = 'energy'), true),
('ACTION', (SELECT id FROM custom_fields WHERE name = 'energy'), true);

-- Assign start date field as optional to Projects, Areas, and Actions only
INSERT INTO bucket_fields (bucket, field_id, required) VALUES
('PROJECT', (SELECT id FROM custom_fields WHERE name = 'startDate'), false),
('AREA', (SELECT id FROM custom_fields WHERE name = 'startDate'), false),
('ACTION', (SELECT id FROM custom_fields WHERE name = 'startDate'), false);

-- Assign end date field as optional to Projects, Areas, and Actions only
INSERT INTO bucket_fields (bucket, field_id, required) VALUES
('PROJECT', (SELECT id FROM custom_fields WHERE name = 'endDate'), false),
('AREA', (SELECT id FROM custom_fields WHERE name = 'endDate'), false),
('ACTION', (SELECT id FROM custom_fields WHERE name = 'endDate'), false);

-- Assign owner field as optional to all buckets
INSERT INTO bucket_fields (bucket, field_id, required) VALUES
('PROJECT', (SELECT id FROM custom_fields WHERE name = 'owner'), false),
('AREA', (SELECT id FROM custom_fields WHERE name = 'owner'), false),
('RESOURCE', (SELECT id FROM custom_fields WHERE name = 'owner'), false),
('ARCHIVE', (SELECT id FROM custom_fields WHERE name = 'owner'), false),
('ACTION', (SELECT id FROM custom_fields WHERE name = 'owner'), false);

-- Assign email field as optional to Projects only
INSERT INTO bucket_fields (bucket, field_id, required) VALUES
('PROJECT', (SELECT id FROM custom_fields WHERE name = 'email'), false);

-- Assign Link field to Resources
INSERT INTO bucket_fields (bucket, field_id, required) VALUES
('RESOURCE', (SELECT id FROM custom_fields WHERE name = 'link'), false);

-- Insert sample data for testing all aspects of the system

-- PROJECTS - Short-term efforts with specific outcomes
INSERT INTO items (bucket, title, description, status, extra_fields) VALUES
('PROJECT', 'Website Redesign', 'Complete overhaul of company website with modern design and improved UX', 'In Progress', 
 '{"priority": "High", "energy": "High", "startDate": "2025-01-15", "endDate": "2025-03-30", "owner": "Sarah Chen", "email": "sarah.chen@company.com"}'),
('PROJECT', 'Mobile App Launch', 'Develop and launch iOS/Android app for customer engagement', 'Next Up',
 '{"priority": "High", "energy": "Medium", "startDate": "2025-02-01", "endDate": "2025-06-15", "owner": "Mike Rodriguez", "email": "mike.rodriguez@company.com"}'),
('PROJECT', 'Team Retreat Planning', 'Organize quarterly team retreat including venue, activities, and logistics', 'On Hold',
 '{"priority": "Medium", "energy": "Low", "startDate": "2025-03-01", "endDate": "2025-04-15", "owner": "Lisa Park"}');

-- AREAS - Ongoing responsibilities to maintain  
INSERT INTO items (bucket, title, description, status, extra_fields) VALUES
('AREA', 'Customer Support Excellence', 'Maintain high-quality customer support with <2hr response time', 'Active',
 '{"priority": "High", "energy": "Medium", "owner": "Jennifer Walsh", "email": "jennifer.walsh@company.com"}'),
('AREA', 'Team Development & Training', 'Ongoing professional development and skill building for team members', 'Active',
 '{"priority": "Medium", "energy": "Medium", "owner": "David Kim"}'),
('AREA', 'Security & Compliance', 'Maintain security standards and regulatory compliance', 'Needs Attention',
 '{"priority": "High", "energy": "High", "owner": "Alex Thompson", "email": "alex.thompson@company.com"}');

-- ACTIONS - Individual actionable tasks
INSERT INTO items (bucket, title, description, status, extra_fields) VALUES
('ACTION', 'Review wireframes for homepage', 'Provide feedback on new homepage wireframes from design team', 'Next',
 '{"priority": "High", "energy": "Low", "endDate": "2025-01-25", "owner": "Sarah Chen"}'),
('ACTION', 'Schedule user interviews', 'Set up 5 user interviews for mobile app research', 'Waiting',
 '{"priority": "Medium", "energy": "Medium", "endDate": "2025-02-05", "owner": "Mike Rodriguez"}'),
('ACTION', 'Update security documentation', 'Revise security policies and incident response procedures', 'Someday',
 '{"priority": "Medium", "energy": "High", "owner": "Alex Thompson"}'),
('ACTION', 'Book venue for team retreat', 'Research and book location for Q2 team retreat', 'Next',
 '{"priority": "Low", "energy": "Low", "endDate": "2025-02-15", "owner": "Lisa Park"}'),
('ACTION', 'Conduct quarterly performance reviews', 'Complete performance reviews for all direct reports', 'Done',
 '{"priority": "High", "energy": "High", "startDate": "2025-01-01", "endDate": "2025-01-15", "owner": "David Kim"}');

-- RESOURCES - Reference materials for future use
INSERT INTO items (bucket, title, description, status, extra_fields) VALUES
('RESOURCE', 'UX Design Best Practices', 'Collection of articles, tools, and guidelines for user experience design', 'Available',
 '{"link": "https://uxdesign.cc/best-practices", "owner": "Sarah Chen"}'),
('RESOURCE', 'Mobile Development Framework Comparison', 'Research comparing React Native, Flutter, and native development approaches', 'In Use',
 '{"link": "https://github.com/company/mobile-framework-research", "owner": "Mike Rodriguez"}'),
('RESOURCE', 'Security Compliance Checklist', 'Comprehensive checklist for SOC2 and GDPR compliance requirements', 'Available',
 '{"link": "https://docs.company.com/security/compliance", "owner": "Alex Thompson"}'),
('RESOURCE', 'Remote Team Management Guide', 'Best practices and tools for managing distributed teams effectively', 'Available',
 '{"link": "https://remote.co/management-guide", "owner": "David Kim"}'),
('RESOURCE', 'Customer Feedback Analysis Tools', 'List of tools and methodologies for analyzing customer feedback', 'Outdated',
 '{"link": "https://tools.company.com/feedback-analysis", "owner": "Jennifer Walsh"}');

-- ARCHIVES - Inactive items from other buckets
INSERT INTO items (bucket, title, description, status, extra_fields) VALUES
('ARCHIVE', 'Q4 2024 Marketing Campaign', 'Holiday season marketing campaign - completed successfully', 'Archived',
 '{"priority": "High", "startDate": "2024-10-01", "endDate": "2024-12-31", "owner": "Marketing Team"}'),
('ARCHIVE', 'Legacy System Migration', 'Migration from old CRM to new platform - completed Q3 2024', 'Archived',
 '{"priority": "High", "startDate": "2024-07-01", "endDate": "2024-09-30", "owner": "IT Team"}');
