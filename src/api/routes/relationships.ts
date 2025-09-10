import { Router } from 'express';
import { PARAService } from '../../service';

const router = Router();
const service = new PARAService();

router.post('/', async (req, res) => {
  try {
    const relationship = await service.addRelationship(req.body);
    res.status(201).json(relationship);
  } catch (error) {
    console.error('Error creating relationship:', error);
    res.status(500).json({ error: 'Failed to create relationship' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await service.removeRelationshipById(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing relationship:', error);
    res.status(500).json({ error: 'Failed to remove relationship' });
  }
});

router.delete('/:parentId/:childId', async (req, res) => {
  try {
    await service.removeRelationship(req.params.parentId, req.params.childId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing relationship:', error);
    res.status(500).json({ error: 'Failed to remove relationship' });
  }
});

router.get('/:itemId', async (req, res) => {
  try {
    const relationships = await service.getItemRelationships(req.params.itemId);
    res.json(relationships);
  } catch (error) {
    console.error('Error getting relationships:', error);
    res.status(500).json({ error: 'Failed to get relationships' });
  }
});

export default router;
