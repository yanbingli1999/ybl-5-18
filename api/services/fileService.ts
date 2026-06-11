import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

export interface ListOptions {
  sortBy?: string;
  order?: 'asc' | 'desc';
}

async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  const dirPath = path.dirname(filePath);
  await ensureDir(dirPath);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

async function listJsonFiles<T>(dirPath: string, options: ListOptions = {}): Promise<T[]> {
  await ensureDir(dirPath);
  const files = await fs.readdir(dirPath);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  const results: T[] = [];
  for (const file of jsonFiles) {
    const data = await readJsonFile<T>(path.join(dirPath, file));
    if (data) {
      results.push(data);
    }
  }
  
  if (options.sortBy) {
    results.sort((a: any, b: any) => {
      const aVal = a[options.sortBy!];
      const bVal = b[options.sortBy!];
      const order = options.order === 'asc' ? 1 : -1;
      if (aVal < bVal) return -1 * order;
      if (aVal > bVal) return 1 * order;
      return 0;
    });
  }
  
  return results;
}

export const fileService = {
  readJsonFile,
  writeJsonFile,
  listJsonFiles,
  deleteFile: async (filePath: string): Promise<boolean> => {
    try {
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  },
  fileExists: async (filePath: string): Promise<boolean> => {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  },
  getPath: (...segments: string[]): string => {
    return path.join(DATA_DIR, ...segments);
  }
};

export default fileService;
