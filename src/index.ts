import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join } from 'path';
import { PARAService } from './service';
import { BucketType } from './types';

const service = new PARAService();
const PORT = process.env.PORT || 3000;

const server = createServer(async (req, res) => {
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
    try {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        const data = JSON.parse(body);
        const field = await service.createCustomField(data);
        res.writeHead(201);
        res.end(JSON.stringify(field));
      });
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
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

  if (req.method === 'POST' && url.pathname === '/api/bucket-fields') {
    try {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        const data = JSON.parse(body);
        await service.assignFieldToBucket(data);
        res.writeHead(201);
        res.end(JSON.stringify({ success: true }));
      });
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal server error' }));
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

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
