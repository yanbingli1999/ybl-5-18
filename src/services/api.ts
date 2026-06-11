import type {
  Material,
  ExperimentConfig,
  TemperatureSnapshot,
  ExperimentResult,
} from '@shared/types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const API_BASE = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  const result = (await response.json()) as ApiResponse<T>;

  if (!result.success) {
    throw new Error(result.error || 'Request failed');
  }

  return result.data as T;
}

export const materialsApi = {
  getAll: () => request<Material[]>('/materials'),
  get: (id: string) => request<Material>(`/materials/${id}`),
  create: (material: Material) =>
    request<Material>('/materials', {
      method: 'POST',
      body: JSON.stringify(material),
    }),
  update: (id: string, material: Partial<Material>) =>
    request<Material>(`/materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(material),
    }),
  delete: (id: string) =>
    request<void>(`/materials/${id}`, {
      method: 'DELETE',
    }),
};

export const experimentsApi = {
  getAll: () => request<ExperimentConfig[]>('/experiments'),
  get: (id: string) => request<ExperimentConfig>(`/experiments/${id}`),
  create: (config: ExperimentConfig) =>
    request<ExperimentConfig>('/experiments', {
      method: 'POST',
      body: JSON.stringify(config),
    }),
  update: (id: string, config: Partial<ExperimentConfig>) =>
    request<ExperimentConfig>(`/experiments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(config),
    }),
  delete: (id: string) =>
    request<void>(`/experiments/${id}`, {
      method: 'DELETE',
    }),
};

export const snapshotsApi = {
  getByExperiment: (experimentId: string) =>
    request<TemperatureSnapshot[]>(`/snapshots/${experimentId}`),
  create: (snapshot: TemperatureSnapshot) =>
    request<TemperatureSnapshot>('/snapshots', {
      method: 'POST',
      body: JSON.stringify(snapshot),
    }),
  delete: (id: string) =>
    request<void>(`/snapshots/${id}`, {
      method: 'DELETE',
    }),
};

export const favoritesApi = {
  getAll: () => request<ExperimentResult[]>('/favorites'),
  create: (result: ExperimentResult) =>
    request<ExperimentResult>('/favorites', {
      method: 'POST',
      body: JSON.stringify(result),
    }),
  delete: (id: string) =>
    request<void>(`/favorites/${id}`, {
      method: 'DELETE',
    }),
};

export const api = {
  materials: materialsApi,
  experiments: experimentsApi,
  snapshots: snapshotsApi,
  favorites: favoritesApi,
};

export default api;
