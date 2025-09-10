import { Router } from 'express';
import { PARAService } from '../../service';

const router = Router();
const service = new PARAService();

router.get('/', async (req, res) => {
  try {
    const statuses = await service.getAllStatuses();
    res.json(statuses);
  } catch (error) {
    console.error('Error fetching statuses:', error);
    res.status(500).json({ error: 'Failed to fetch statuses' });
  }
});

export default router;
