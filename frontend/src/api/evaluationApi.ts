import axios from 'axios';
import type { EvaluationDetail, FeatureTimeSeries, DatasetItem } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
});

export const evaluationApi = {
  getHealth: async () => {
    const res = await api.get('/health');
    return res.data;
  },

  startDemoEvaluation: async (): Promise<{ evaluationId: string; status: string }> => {
    const res = await api.post('/evaluations/demo');
    return res.data;
  },

  createEvaluation: async (formData: FormData): Promise<{ evaluationId: string; status: string }> => {
    const res = await api.post('/evaluations', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  getEvaluationStatus: async (id: string) => {
    const res = await api.get(`/evaluations/${id}`);
    return res.data;
  },

  getEvaluationResults: async (id: string): Promise<EvaluationDetail> => {
    const res = await api.get(`/evaluations/${id}/results`);
    return res.data;
  },

  getEvaluationFeatures: async (id: string): Promise<FeatureTimeSeries> => {
    const res = await api.get(`/evaluations/${id}/features`);
    return res.data;
  },

  getDataset: async (): Promise<DatasetItem[]> => {
    const res = await api.get('/dataset');
    return res.data;
  },
};
