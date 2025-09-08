-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create bucket type enum
CREATE TYPE bucket_type AS ENUM ('PROJECT', 'AREA', 'RESOURCE', 'ARCHIVE', 'ACTION');

-- Create field type enum
CREATE TYPE field_type AS ENUM ('text', 'boolean', 'array', 'date', 'datetime');

-- Create custom field definitions table
CREATE TABLE custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
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
('PROJECT', 'Doing', 2),
('PROJECT', 'In Review', 3),
('PROJECT', 'On Hold', 4),
('PROJECT', 'Wont Do', 5),
('PROJECT', 'Completed', 6),
-- Areas
('AREA', 'Next Up', 1),
('AREA', 'Doing', 2),
('AREA', 'In Review', 3),
('AREA', 'On Hold', 4),
('AREA', 'Wont Do', 5),
('AREA', 'Completed', 6),
-- Resources
('RESOURCE', 'Next Up', 1),
('RESOURCE', 'Doing', 2),
('RESOURCE', 'In Review', 3),
('RESOURCE', 'On Hold', 4),
('RESOURCE', 'Wont Do', 5),
('RESOURCE', 'Completed', 6),
-- Archive
('ARCHIVE', 'Next Up', 1),
('ARCHIVE', 'Doing', 2),
('ARCHIVE', 'In Review', 3),
('ARCHIVE', 'On Hold', 4),
('ARCHIVE', 'Wont Do', 5),
('ARCHIVE', 'Completed', 6),
-- Actions
('ACTION', 'Next Up', 1),
('ACTION', 'Doing', 2),
('ACTION', 'In Review', 3),
('ACTION', 'On Hold', 4),
('ACTION', 'Wont Do', 5),
('ACTION', 'Completed', 6);

-- Insert priority custom field
INSERT INTO custom_fields (name, type, description, default_value, array_options, multi_select) VALUES
('priority', 'array', 'Priority level', '["Medium"]', ARRAY['High', 'Medium', 'Low'], false);

-- Insert urgency custom field
INSERT INTO custom_fields (name, type, description, default_value, array_options, multi_select) VALUES
('urgency', 'array', 'Urgency level', '["Medium"]', ARRAY['Extreme', 'High', 'Medium', 'Low'], false);

-- Insert start date custom field
INSERT INTO custom_fields (name, type, description, default_value, array_options, multi_select) VALUES
('startDate', 'date', 'Start date', null, null, false);

-- Insert end date custom field
INSERT INTO custom_fields (name, type, description, default_value, array_options, multi_select) VALUES
('endDate', 'date', 'End date', null, null, false);

-- Insert owner custom field
INSERT INTO custom_fields (name, type, description, default_value, array_options, multi_select) VALUES
('owner', 'text', 'Owner', null, null, false);

-- Insert test custom field
INSERT INTO custom_fields (name, type, description, default_value, array_options, multi_select) VALUES
('test', 'text', 'Test field', null, null, false);

-- Insert email custom field
INSERT INTO custom_fields (name, type, description, default_value, array_options, multi_select) VALUES
('email', 'text', 'Email address', null, null, false);

-- Assign priority field as required to Projects, Areas, and Actions only
INSERT INTO bucket_fields (bucket, field_id, required) VALUES
('PROJECT', (SELECT id FROM custom_fields WHERE name = 'priority'), true),
('AREA', (SELECT id FROM custom_fields WHERE name = 'priority'), true),
('ACTION', (SELECT id FROM custom_fields WHERE name = 'priority'), true);

-- Assign urgency field as required to Projects, Areas, and Actions only
INSERT INTO bucket_fields (bucket, field_id, required) VALUES
('PROJECT', (SELECT id FROM custom_fields WHERE name = 'urgency'), true),
('AREA', (SELECT id FROM custom_fields WHERE name = 'urgency'), true),
('ACTION', (SELECT id FROM custom_fields WHERE name = 'urgency'), true);

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

-- Assign test field as optional to Projects only
INSERT INTO bucket_fields (bucket, field_id, required) VALUES
('PROJECT', (SELECT id FROM custom_fields WHERE name = 'test'), false);

-- Assign email field as optional to Projects only
INSERT INTO bucket_fields (bucket, field_id, required) VALUES
('PROJECT', (SELECT id FROM custom_fields WHERE name = 'email'), false);
