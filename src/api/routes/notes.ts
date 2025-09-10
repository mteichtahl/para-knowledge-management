import { Router } from 'express';
import { PARAService } from '../../service';

const router = Router();
const service = new PARAService();

router.get('/:itemId', async (req, res) => {
  try {
    const notes = await service.getNotes(req.params.itemId);
    res.json(notes);
  } catch (error) {
    console.error('Error getting notes:', error);
    res.status(500).json({ error: 'Failed to get notes' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { itemId, content } = req.body;
    const note = await service.createNote(itemId, content);
    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { content } = req.body;
    const note = await service.updateNote(req.params.id, content);
    res.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await service.deleteNote(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router;
