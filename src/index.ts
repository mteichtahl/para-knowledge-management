import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PARAService } from './service';
import { BucketType } from './types';
import { db } from './db';
import { bucketFields } from './schema';

const service = new PARAService();
const PORT = process.env.PORT || 3000;

const server = createServer(async (req, res) => {
  console.log(`=== REQUEST: ${req.method} ${req.url} ===`);
  const url = new URL(req.url!, `http://${req.headers.host}`);
  
  // Serve static files
  if (req.method === 'GET' && url.pathname === '/') {
    try {
      const html = readFileSync(join(__dirname, '../public/index.html'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
    return;
  }
  
  if (req.method === 'GET' && url.pathname === '/fields') {
    try {
      const html = readFileSync(join(__dirname, '../public/fields.html'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/custom-fields') {
    try {
      const fields = await service.getCustomFields();
      res.writeHead(200);
      res.end(JSON.stringify(fields));
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/custom-fields') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        console.log('Creating custom field:', data);
        const field = await service.createCustomField(data);
        console.log('Custom field created:', field);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(field));
      } catch (error: any) {
        console.error('Error creating custom field:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        if (error.code === '23505') {
          res.end(JSON.stringify({ error: 'A field with this name already exists' }));
        } else {
          res.end(JSON.stringify({ error: error.message || 'Failed to create custom field' }));
        }
      }
    });
    return;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/api/bucket-fields/')) {
    try {
      const bucket = url.pathname.split('/')[3] as any;
      const fields = await service.getBucketFields(bucket);
      res.writeHead(200);
      res.end(JSON.stringify(fields));
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/test-bucket-assignment') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        console.log('Test endpoint received:', data);
        
        // Direct database insert to bypass service layer
        const result = await db.insert(bucketFields).values({
          bucket: data.bucketType as any,
          fieldId: data.customFieldId,
          required: false
        }).returning();
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result[0]));
      } catch (error: any) {
        console.error('Test endpoint error:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }
    return;
  }
  
  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/items') {
    try {
      const allItems = [];
      for (const bucket of Object.values(BucketType)) {
        const items = await service.getItemsByBucket(bucket);
        // Add relationships and notes to each item
        for (const item of items) {
          const relatedItems = await service.getRelatedItems(item.id);
          const notes = await service.getItemNotes(item.id);
          (item as any).relatedItems = relatedItems;
          (item as any).notes = notes;
        }
        allItems.push(...items);
      }
      res.writeHead(200);
      res.end(JSON.stringify(allItems));
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/items') {
    try {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        const data = JSON.parse(body);
        const item = await service.createItem(data);
        res.writeHead(201);
        res.end(JSON.stringify(item));
      });
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/relationships') {
    try {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        const data = JSON.parse(body);
        const relationship = await service.addRelationship(data);
        res.writeHead(201);
        res.end(JSON.stringify(relationship));
      });
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/notes') {
    try {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        const data = JSON.parse(body);
        const note = await service.addNote(data);
        res.writeHead(201);
        res.end(JSON.stringify(note));
      });
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/search') {
    try {
      const query = url.searchParams.get('q');
      const bucket = url.searchParams.get('bucket') as BucketType;
      if (!query) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Query parameter required' }));
        return;
      }
      const results = await service.searchItems(query, bucket);
      res.writeHead(200);
      res.end(JSON.stringify(results));
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
    return;
  }

  if (req.method === 'DELETE' && url.pathname.startsWith('/api/bucket-fields/')) {
    try {
      const pathParts = url.pathname.split('/');
      const bucket = pathParts[3];
      const fieldId = pathParts[4];
      
      console.log('Removing field from bucket:', { bucket, fieldId });
      await service.removeFieldFromBucket(bucket as any, fieldId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } catch (error: any) {
      console.error('Error removing field from bucket:', error);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message || 'Failed to remove field from bucket' }));
    }
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
