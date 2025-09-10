import { Router } from 'express';
import { PARAService } from '../../service';

const router = Router();
const service = new PARAService();

router.get('/', async (req, res) => {
  try {
    const items = await service.getAllItems();
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

router.post('/', async (req, res) => {
  try {
    const itemData = req.body;
    const createInput = {
      ...itemData,
      statusName: itemData.statusName || itemData.status
    };
    delete createInput.status;
    
    const item = await service.createItem(createInput);
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    await service.updateItem(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await service.deleteItem(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;
