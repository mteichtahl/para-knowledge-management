import { Router } from 'express';
import { PARAService } from '../../service';
import { BedrockService } from '../../bedrock-service';

const router = Router();
const service = new PARAService();

router.post('/', async (req, res) => {
  try {
    const bedrockService = new BedrockService();
    
    const items = await service.getAllItems();
    const allNotes = await service.getAllNotes();
    
    const content = `
PROJECTS: ${items.filter(i => i.bucket === 'PROJECT').map(i => `${i.title}: ${i.description || 'No description'}`).join('\n')}

AREAS: ${items.filter(i => i.bucket === 'AREA').map(i => `${i.title}: ${i.description || 'No description'}`).join('\n')}

RESOURCES: ${items.filter(i => i.bucket === 'RESOURCE').map(i => `${i.title}: ${i.description || 'No description'}`).join('\n')}

ARCHIVES: ${items.filter(i => i.bucket === 'ARCHIVE').map(i => `${i.title}: ${i.description || 'No description'}`).join('\n')}

ACTIONS: ${items.filter(i => i.bucket === 'ACTION').map(i => `${i.title}: ${i.description || 'No description'}`).join('\n')}

NOTES: ${allNotes.map(n => n.content).join('\n')}
    `.trim();

    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    try {
      for await (const chunk of bedrockService.streamSummary(content)) {
        res.write(chunk);
      }
      res.end();
    } catch (streamError) {
      console.error('Error during streaming:', streamError);
      const errorMessage = streamError instanceof Error ? streamError.message : 'Failed to generate summary';
      res.write(`\n\nError: ${errorMessage}`);
      res.end();
    }
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

export default router;
