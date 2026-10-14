import axios, { AxiosError } from 'axios';
import type {
  EvaluationDetail,
  FeatureTimeSeries,
  DatasetItem,
  BenchmarkResponse,
  EvaluationStatus,
  EvaluationHistoryResponse,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
});

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (typeof data?.detail === 'string') {
      return data.detail;
    }
    if (Array.isArray(data?.detail) && data.detail[0]?.msg) {
      return data.detail[0].msg;
    }
    return error.message || 'Network error communicating with speech analysis server.';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred.';
}

export const evaluationApi = {
  getHealth: async (): Promise<{ status: string; app: string; tagline?: string }> => {
    const res = await api.get('/health');
    return res.data;
  },

  startDemoEvaluation: async (): Promise<{
    evaluationId: string;
    status: string;
    progress: number;
    currentStep: string;
  }> => {
    const res = await api.post('/evaluations/demo');
    return res.data;
  },

  createEvaluation: async (
    formData: FormData
  ): Promise<{
    evaluationId: string;
    status: string;
    progress: number;
    currentStep: string;
  }> => {
    const res = await api.post('/evaluations', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  getEvaluationStatus: async (id: string | number): Promise<EvaluationStatus> => {
    const res = await api.get(`/evaluations/${id}`);
    return res.data;
  },

  getEvaluationResults: async (id: string | number): Promise<EvaluationDetail> => {
    const res = await api.get(`/evaluations/${id}/results`);
    return res.data;
  },

  getEvaluationFeatures: async (id: string | number): Promise<FeatureTimeSeries> => {
    const res = await api.get(`/evaluations/${id}/features`);
    return res.data;
  },

  getEvaluationsHistory: async (
    limit: number = 50,
    offset: number = 0
  ): Promise<EvaluationHistoryResponse> => {
    const res = await api.get(`/evaluations?limit=${limit}&offset=${offset}`);
    return res.data;
  },

  getEvaluationHistory: async (
    limit: number = 50,
    offset: number = 0
  ): Promise<EvaluationHistoryResponse> => {
    const res = await api.get(`/evaluations?limit=${limit}&offset=${offset}`);
    return res.data;
  },

  deleteEvaluation: async (id: string | number): Promise<{ message: string; id: string }> => {
    const res = await api.delete(`/evaluations/${id}`);
    return res.data;
  },

  getDataset: async (): Promise<DatasetItem[]> => {
    const res = await api.get('/dataset');
    return res.data;
  },

  runBenchmark: async (forceRefresh: boolean = false): Promise<BenchmarkResponse> => {
    const res = await api.get(`/dataset/benchmark?force_refresh=${forceRefresh}`);
    return res.data;
  },

  evaluateDatasetVariant: async (
    param1: { speechId?: string; variantName?: string; variantIndex?: number } | string,
    param2?: string
  ): Promise<{
    evaluationId: string;
    status: string;
    progress: number;
    currentStep: string;
    variantName?: string;
  }> => {
    let payload: { speechId?: string; variantName?: string; variantIndex?: number } = {};
    if (typeof param1 === 'string') {
      payload = { speechId: param1, variantName: param2 };
    } else {
      payload = param1;
    }
    const res = await api.post('/evaluations/dataset', payload);
    return res.data;
  },

  evaluateVariant: async (variantIndex: number): Promise<{
    evaluationId: string;
    status: string;
    progress: number;
    currentStep: string;
    variantName?: string;
  }> => {
    const res = await api.post(`/evaluations/variant/${variantIndex}`);
    return res.data;
  },
};
