import { Router, type Request, type Response } from 'express';
import fileService from '../services/fileService.js';
import type { Material } from '../../shared/types.js';

const router = Router();
const MATERIALS_FILE = fileService.getPath('materials.json');

router.get('/', async (req: Request, res: Response) => {
  try {
    const materials = await fileService.readJsonFile<Material[]>(MATERIALS_FILE);
    res.json({ success: true, data: materials || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load materials' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const materials = await fileService.readJsonFile<Material[]>(MATERIALS_FILE);
    const material = materials?.find(m => m.id === req.params.id);
    if (!material) {
      return res.status(404).json({ success: false, error: 'Material not found' });
    }
    res.json({ success: true, data: material });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load material' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const materials = await fileService.readJsonFile<Material[]>(MATERIALS_FILE) || [];
    const newMaterial: Material = req.body;
    
    if (materials.some(m => m.id === newMaterial.id)) {
      return res.status(400).json({ success: false, error: 'Material ID already exists' });
    }
    
    materials.push(newMaterial);
    await fileService.writeJsonFile(MATERIALS_FILE, materials);
    res.json({ success: true, data: newMaterial });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create material' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const materials = await fileService.readJsonFile<Material[]>(MATERIALS_FILE) || [];
    const index = materials.findIndex(m => m.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Material not found' });
    }
    
    materials[index] = { ...materials[index], ...req.body };
    await fileService.writeJsonFile(MATERIALS_FILE, materials);
    res.json({ success: true, data: materials[index] });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update material' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const materials = await fileService.readJsonFile<Material[]>(MATERIALS_FILE) || [];
    const filtered = materials.filter(m => m.id !== req.params.id);
    
    if (filtered.length === materials.length) {
      return res.status(404).json({ success: false, error: 'Material not found' });
    }
    
    await fileService.writeJsonFile(MATERIALS_FILE, filtered);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete material' });
  }
});

export default router;
