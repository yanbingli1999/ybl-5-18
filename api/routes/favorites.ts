import { Router, type Request, type Response } from 'express';
import fileService from '../services/fileService.js';
import type { ExperimentResult } from '../../shared/types.js';

const router = Router();
const FAVORITES_DIR = fileService.getPath('favorites');

router.get('/', async (req: Request, res: Response) => {
  try {
    const favorites = await fileService.listJsonFiles<ExperimentResult>(FAVORITES_DIR, {
      sortBy: 'completedAt',
      order: 'desc'
    });
    res.json({ success: true, data: favorites });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load favorites' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const result: ExperimentResult = req.body;
    const filePath = fileService.getPath('favorites', `${result.id}.json`);
    
    if (await fileService.fileExists(filePath)) {
      return res.status(400).json({ success: false, error: 'Favorite already exists' });
    }
    
    await fileService.writeJsonFile(filePath, result);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to add favorite' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const filePath = fileService.getPath('favorites', `${req.params.id}.json`);
    const deleted = await fileService.deleteFile(filePath);
    
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Favorite not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete favorite' });
  }
});

export default router;
