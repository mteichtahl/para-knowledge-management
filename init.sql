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
('PROJECT', 'Planning', 1),
('PROJECT', 'In Progress', 2),
('PROJECT', 'On Hold', 3),
('PROJECT', 'Completed', 4),
-- Areas
('AREA', 'Active', 1),
('AREA', 'Needs Attention', 2),
('AREA', 'Maintaining', 3),
-- Resources
('RESOURCE', 'Available', 1),
('RESOURCE', 'In Use', 2),
('RESOURCE', 'Outdated', 3),
-- Archive
('ARCHIVE', 'Archived', 1),
-- Actions
('ACTION', 'Next', 1),
('ACTION', 'Waiting', 2),
('ACTION', 'Someday', 3),
('ACTION', 'Done', 4);

-- Insert default custom fields
INSERT INTO custom_fields (name, type, description, default_value, array_options, multi_select) VALUES
('priority', 'array', 'Priority level', '["medium"]', ARRAY['low', 'medium', 'high'], false),
('deadline', 'date', 'Due date for completion', null, null, false),
('isUrgent', 'boolean', 'Urgent flag', 'false', null, false),
('tags', 'array', 'Category tags', '[]', ARRAY['work', 'personal', 'urgent', 'meeting', 'research'], true),
('estimatedHours', 'text', 'Estimated time to complete', '"4"', null, false);

-- Assign default fields to buckets
INSERT INTO bucket_fields (bucket, field_id) 
SELECT 'PROJECT', id FROM custom_fields WHERE name IN ('priority', 'deadline', 'estimatedHours');

INSERT INTO bucket_fields (bucket, field_id)
SELECT 'ACTION', id FROM custom_fields WHERE name IN ('priority', 'isUrgent', 'deadline');
