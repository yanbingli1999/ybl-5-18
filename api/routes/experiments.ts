import { Router, type Request, type Response } from 'express';
import fileService from '../services/fileService.js';
import type { ExperimentConfig } from '../../shared/types.js';

const router = Router();
const EXPERIMENTS_DIR = fileService.getPath('experiments');

router.get('/', async (req: Request, res: Response) => {
  try {
    const experiments = await fileService.listJsonFiles<ExperimentConfig>(EXPERIMENTS_DIR, {
      sortBy: 'createdAt',
      order: 'desc'
    });
    res.json({ success: true, data: experiments });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load experiments' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const filePath = fileService.getPath('experiments', `${req.params.id}.json`);
    const experiment = await fileService.readJsonFile<ExperimentConfig>(filePath);
    
    if (!experiment) {
      return res.status(404).json({ success: false, error: 'Experiment not found' });
    }
    
    res.json({ success: true, data: experiment });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load experiment' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const experiment: ExperimentConfig = req.body;
    const filePath = fileService.getPath('experiments', `${experiment.id}.json`);
    
    if (await fileService.fileExists(filePath)) {
      return res.status(400).json({ success: false, error: 'Experiment ID already exists' });
    }
    
    await fileService.writeJsonFile(filePath, experiment);
    res.json({ success: true, data: experiment });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create experiment' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const filePath = fileService.getPath('experiments', `${req.params.id}.json`);
    const existing = await fileService.readJsonFile<ExperimentConfig>(filePath);
    
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Experiment not found' });
    }
    
    const updated = { ...existing, ...req.body };
    await fileService.writeJsonFile(filePath, updated);
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update experiment' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const filePath = fileService.getPath('experiments', `${req.params.id}.json`);
    const deleted = await fileService.deleteFile(filePath);
    
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Experiment not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete experiment' });
  }
});

export default router;
