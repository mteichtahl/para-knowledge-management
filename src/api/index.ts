import { Router } from 'express';
import itemsRouter from './routes/items';
import statusesRouter from './routes/statuses';
import customFieldsRouter from './routes/custom-fields';
import bucketFieldsRouter from './routes/bucket-fields';
import relationshipsRouter from './routes/relationships';
import notesRouter from './routes/notes';
import summaryRouter from './routes/summary';

const router = Router();

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Mount route modules
router.use('/items', itemsRouter);
router.use('/statuses', statusesRouter);
router.use('/custom-fields', customFieldsRouter);
router.use('/bucket-fields', bucketFieldsRouter);
router.use('/relationships', relationshipsRouter);
router.use('/notes', notesRouter);
router.use('/summary', summaryRouter);

export default router;
