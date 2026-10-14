export interface RubricScoreItem {
  category: string;
  score: number;
  weight: number;
  description?: string;
}

export interface FlawSegment {
  id: string;
  start: number;
  end: number;
  duration: number;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  transcript?: string;
  cause: string;
  effect: string;
  recommendation: string;
  metrics: Record<string, any>;
}

export interface EvaluationSummary {
  overallScore: number;
  similarity: number;
  confidence: number;
  totalFlaws: number;
  strongestArea: string;
  weakestArea: string;
}

export interface EvaluationDetail {
  evaluationId: string;
  title: string;
  transcript: string;
  status: string;
  error?: string;
  summary: EvaluationSummary;
  rubric: Record<string, number>;
  rubricDetails: RubricScoreItem[];
  flaws: FlawSegment[];
  referenceAudioUrl: string;
  participantAudioUrl: string;
  referenceDuration: number;
  participantDuration: number;
  alignmentWords?: Array<{
    word: string;
    ref_start: number;
    ref_end: number;
    part_start: number;
    part_end: number;
  }>;
}

export interface FeatureTimeSeries {
  timePoints: number[];
  referenceFeatures: {
    pitch: number[];
    rms: number[];
    wpm: number[];
  };
  participantFeatures: {
    pitch: number[];
    rms: number[];
    wpm: number[];
  };
  deviations: number[];
  flawRegions: Array<{
    start: number;
    end: number;
    type: string;
    severity: string;
  }>;
}

export interface DatasetVariant {
  variantName: string;
  filePath: string;
  expectedFlaw: string;
  severity: string;
  description: string;
}

export interface DatasetItem {
  id: string;
  title: string;
  transcript: string;
  referenceAudioPath: string;
  variants: DatasetVariant[];
}
