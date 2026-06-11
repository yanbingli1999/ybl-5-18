import { Router, type Request, type Response } from 'express';
import fileService from '../services/fileService.js';
import type { TemperatureSnapshot } from '../../shared/types.js';

const router = Router();
const SNAPSHOTS_DIR = fileService.getPath('snapshots');

router.get('/:experimentId', async (req: Request, res: Response) => {
  try {
    const experimentId = req.params.experimentId;
    const allSnapshots = await fileService.listJsonFiles<TemperatureSnapshot>(SNAPSHOTS_DIR, {
      sortBy: 'step',
      order: 'asc'
    });
    
    const filtered = allSnapshots.filter(s => s.experimentId === experimentId);
    res.json({ success: true, data: filtered });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load snapshots' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const snapshot: TemperatureSnapshot = req.body;
    const filePath = fileService.getPath('snapshots', `${snapshot.id}.json`);
    
    if (await fileService.fileExists(filePath)) {
      return res.status(400).json({ success: false, error: 'Snapshot ID already exists' });
    }
    
    await fileService.writeJsonFile(filePath, snapshot);
    res.json({ success: true, data: snapshot });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create snapshot' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const filePath = fileService.getPath('snapshots', `${req.params.id}.json`);
    const deleted = await fileService.deleteFile(filePath);
    
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Snapshot not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete snapshot' });
  }
});

export default router;
