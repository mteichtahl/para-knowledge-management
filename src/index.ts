import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PARAService } from './service';
import { BucketType } from './types';

const service = new PARAService();
const PORT = process.env.PORT || 3000;

const server = createServer(async (req, res) => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const { pathname } = url;
  const method = req.method;

  // Parse request body for POST/PUT requests
  let body = '';
  if (method === 'POST' || method === 'PUT') {
    for await (const chunk of req) {
      body += chunk;
    }
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check
  if (method === 'GET' && pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  // API Routes
  if (method === 'GET' && pathname === '/api/items') {
    try {
      const items = await service.getAllItems();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(items));
    } catch (error) {
      console.error('Error fetching items:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch items' }));
    }
    return;
  }

  if (method === 'POST' && pathname === '/api/items') {
    try {
      const itemData = JSON.parse(body);
      const item = await service.createItem(itemData);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(item));
    } catch (error) {
      console.error('Error creating item:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to create item' }));
    }
    return;
  }

  if (method === 'PUT' && pathname.startsWith('/api/items/')) {
    try {
      const id = pathname.split('/')[3];
      const itemData = JSON.parse(body);
      await service.updateItem(id, itemData);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (error) {
      console.error('Error updating item:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to update item' }));
    }
    return;
  }

  if (method === 'DELETE' && pathname.startsWith('/api/items/')) {
    try {
      const id = pathname.split('/')[3];
      await service.deleteItem(id);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (error) {
      console.error('Error deleting item:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to delete item' }));
    }
    return;
  }

  // Custom fields
  if (method === 'GET' && pathname === '/api/custom-fields') {
    try {
      const fields = await service.getCustomFields();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(fields));
    } catch (error) {
      console.error('Error fetching custom fields:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch custom fields' }));
    }
    return;
  }

  if (method === 'POST' && pathname === '/api/custom-fields') {
    try {
      const fieldData = JSON.parse(body);
      const field = await service.createCustomField(fieldData);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(field));
    } catch (error) {
      console.error('Error creating custom field:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to create custom field' }));
    }
    return;
  }

  if (method === 'PUT' && pathname.startsWith('/api/custom-fields/')) {
    try {
      const fieldId = pathname.split('/')[3];
      const fieldData = JSON.parse(body);
      const field = await service.updateCustomField(fieldId, fieldData);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(field));
    } catch (error) {
      console.error('Error updating custom field:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to update custom field' }));
    }
    return;
  }

  // Bucket fields
  if (method === 'GET' && pathname.startsWith('/api/bucket-fields/')) {
    try {
      const bucket = pathname.split('/')[3] as BucketType;
      const fields = await service.getBucketFields(bucket);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(fields));
    } catch (error) {
      console.error('Error fetching bucket fields:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch bucket fields' }));
    }
    return;
  }

  if (method === 'POST' && pathname === '/api/bucket-fields') {
    try {
      const { bucketType, customFieldId, required } = JSON.parse(body);
      const result = await service.assignFieldToBucket(customFieldId, bucketType, required);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (error) {
      console.error('Error assigning field to bucket:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to assign field to bucket' }));
    }
    return;
  }

  if (method === 'DELETE' && pathname.startsWith('/api/bucket-fields/')) {
    try {
      const pathParts = pathname.split('/');
      const bucket = pathParts[3];
      const fieldId = pathParts[4];
      await service.removeFieldFromBucket(fieldId, bucket);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (error) {
      console.error('Error removing field from bucket:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to remove field from bucket' }));
    }
    return;
  }

  // Relationships
  if (method === 'POST' && pathname === '/api/relationships') {
    try {
      const relationshipData = JSON.parse(body);
      const relationship = await service.addRelationship(relationshipData);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(relationship));
    } catch (error) {
      console.error('Error creating relationship:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to create relationship' }));
    }
    return;
  }

  if (method === 'DELETE' && pathname.startsWith('/api/relationships/')) {
    try {
      const pathParts = pathname.split('/');
      const parentId = pathParts[3];
      const childId = pathParts[4];
      await service.removeRelationship(parentId, childId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (error) {
      console.error('Error removing relationship:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to remove relationship' }));
    }
    return;
  }

  if (method === 'GET' && pathname.startsWith('/api/relationships/')) {
    try {
      const itemId = pathname.split('/')[3];
      const relationships = await service.getItemRelationships(itemId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(relationships));
    } catch (error) {
      console.error('Error getting relationships:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to get relationships' }));
    }
    return;
  }

  // Serve static files
  if (method === 'GET') {
    try {
      let filePath = pathname === '/' ? '/index.html' : pathname;
      const fullPath = join(process.cwd(), 'public', filePath);
      const content = readFileSync(fullPath);
      
      const ext = filePath.split('.').pop();
      const contentType = ext === 'html' ? 'text/html' : 
                         ext === 'css' ? 'text/css' : 
                         ext === 'js' ? 'application/javascript' : 
                         'text/plain';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (error) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
