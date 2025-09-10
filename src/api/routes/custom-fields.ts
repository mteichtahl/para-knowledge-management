import { Router } from 'express';
import { PARAService } from '../../service';

const router = Router();
const service = new PARAService();

router.get('/', async (req, res) => {
  try {
    const fields = await service.getCustomFields();
    res.json(fields);
  } catch (error) {
    console.error('Error fetching custom fields:', error);
    res.status(500).json({ error: 'Failed to fetch custom fields' });
  }
});

router.post('/', async (req, res) => {
  try {
    const field = await service.createCustomField(req.body);
    res.status(201).json(field);
  } catch (error) {
    console.error('Error creating custom field:', error);
    res.status(500).json({ error: 'Failed to create custom field' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const field = await service.updateCustomField(req.params.id, req.body);
    res.json(field);
  } catch (error) {
    console.error('Error updating custom field:', error);
    res.status(500).json({ error: 'Failed to update custom field' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await service.deleteCustomField(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting custom field:', error);
    res.status(500).json({ error: 'Failed to delete custom field' });
  }
});

export default router;
