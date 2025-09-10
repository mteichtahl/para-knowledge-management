import { Router } from 'express';
import { PARAService } from '../../service';
import { BucketType } from '../../types';

const router = Router();
const service = new PARAService();

router.get('/:bucket', async (req, res) => {
  try {
    const fields = await service.getBucketFields(req.params.bucket as BucketType);
    res.json(fields);
  } catch (error) {
    console.error('Error fetching bucket fields:', error);
    res.status(500).json({ error: 'Failed to fetch bucket fields' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { bucketType, customFieldId, required } = req.body;
    const result = await service.assignFieldToBucket(customFieldId, bucketType, required);
    res.json(result);
  } catch (error) {
    console.error('Error assigning field to bucket:', error);
    res.status(500).json({ error: 'Failed to assign field to bucket' });
  }
});

router.delete('/:bucket/:fieldId', async (req, res) => {
  try {
    await service.removeFieldFromBucket(req.params.fieldId, req.params.bucket);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing field from bucket:', error);
    res.status(500).json({ error: 'Failed to remove field from bucket' });
  }
});

export default router;
