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
  variantName: string;
  gradientLevel?: string;
  filePath: string;
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
  referenceAudioPath: string;
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
  gradientLevel: string;
  expectedFlaw: string;
  severity: string;
  overallScore: number;
  similarity: number;
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
