export interface RubricScoreItem {
  category: string;
  score: number;
  weight: number;
  description?: string;
}

export interface FlawMetricDetail {
  name: string;
  unit: string;
  participant_val: number;
  reference_val: number;
  delta_pct: number;
  threshold_pct?: number;
  direction?: string;
}

export interface FlawExplanation {
  summary?: string;
  cause?: string;
  effect?: string;
  recommendation?: string;
  why_flagged?: string;
  metrics?: FlawMetricDetail[];
}

export interface FlawSegment {
  id: string;
  start: number;
  end: number;
  duration: number;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  transcript?: string;
  cause?: string;
  effect?: string;
  recommendation?: string;
  metrics?: Record<string, any>;
  explanation?: FlawExplanation;
}

export interface EvaluationSummary {
  overallScore: number;
  similarity: number;
  confidence: number;
  totalFlaws: number;
  strongestArea: string;
  weakestArea: string;
}

export interface EvaluationStatus {
  id: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress: number;
  currentStep: string;
  current_step?: string | null;
  overallScore?: number;
  similarity?: number;
  confidence?: number;
  error?: string | null;
  error_message?: string | null;
}

export interface EvaluationHistoryItem {
  id: string;
  title: string;
  createdAt: string;
  created_at?: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  progress?: number;
  overallScore?: number | null;
  overall_score?: number | null;
  similarity?: number | null;
  totalFlaws?: number;
  flaw_count?: number;
  referenceDuration?: number;
  participantDuration?: number;
}

export interface EvaluationHistoryResponse {
  items: EvaluationHistoryItem[];
  total: number;
}

export interface ValidationDetailItem {
  expectedType: string;
  detectedType: string;
  typeMatched: boolean;
  expectedInterval: string;
  detectedInterval: string;
  temporalIoU: number;
  startTimeErrorSec: number;
  endTimeErrorSec: number;
  status: 'DETECTED' | 'MISSED';
  expectedSeverity: string;
  detectedSeverity: string;
}

export interface ValidationResult {
  totalExpected: number;
  detectedCount: number;
  detectionRatePct: number;
  typeMatchRatePct: number;
  averageTemporalIoU: number;
  validationDetails: ValidationDetailItem[];
}

export interface AuditConfig {
  paceThreshold: number;
  pitchVarianceThreshold: number;
  pauseThreshold: number;
  energyThreshold: number;
  minFlawDurationSec: number;
  flawMergeGapSec: number;
  rubricWeights: Record<string, number>;
}

export interface EvaluationDetail {
  evaluationId: string;
  title: string;
  transcript: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  error?: string;
  summary: EvaluationSummary;
  rubric: Record<string, number>;
  rubricDetails: RubricScoreItem[];
  rubricScores?: RubricScoreItem[];
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
  configAudit?: AuditConfig;
  groundTruthValidation?: ValidationResult;
}

export interface FeatureTimeSeries {
  timePoints: number[];
  referenceFeatures: {
    pitch: (number | null)[];
    rms: (number | null)[];
    wpm: (number | null)[];
  };
  participantFeatures: {
    pitch: (number | null)[];
    rms: (number | null)[];
    wpm: (number | null)[];
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
  name?: string;
  variantName: string;
  tier?: string;
  gradientLevel?: string;
  filePath?: string;
  audioUrl?: string;
  speedFactor?: number;
  volumeDeltaDb?: number;
  expectedFlaw: string;
  severity: string;
  expectedInterval?: string;
  description: string;
}

export interface DatasetItem {
  id: string;
  title: string;
  transcript: string;
  category?: string;
  speaker?: string;
  referenceAudioPath?: string;
  referenceAudioUrl?: string;
  expectedFlaws?: Array<{
    type: string;
    start: number;
    end: number;
    severity: string;
    targetSentence?: string;
    description?: string;
  }>;
  variants: DatasetVariant[];
}

export interface BenchmarkVariantResult {
  variantName: string;
  tier?: string;
  gradientLevel: string;
  expectedFlaw: string;
  severity: string;
  overallScore: number;
  similarity: number;
  flawsDetected?: number;
  detectedFlawsCount: number;
  temporalIoU: number;
  status: string;
  notes: string;
}

export interface BenchmarkResponse {
  totalEvaluated: number;
  monotonicityPassed: boolean;
  averageIoU: number;
  results: BenchmarkVariantResult[];
}
