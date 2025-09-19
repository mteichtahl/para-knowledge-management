-- Add 'number' to field_type enum
ALTER TYPE field_type ADD VALUE 'number';

-- Insert progress custom field
INSERT INTO custom_fields (name, label, type, description, default_value, array_options, multi_select) VALUES
('progress', 'Progress', 'number', 'Progress percentage (0-100)', '0', null, false);

-- Assign progress field to Actions bucket
INSERT INTO bucket_fields (bucket, field_id, required) VALUES
('ACTION', (SELECT id FROM custom_fields WHERE name = 'progress'), false);
