from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class RecordingSchema(BaseModel):
    id: str
    type: str
    duration: float
    sample_rate: int
    original_filename: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SpeechSchema(BaseModel):
    id: str
    title: str
    transcript: str
    created_at: datetime

    class Config:
        from_attributes = True

class RubricScoreItem(BaseModel):
    category: str
    score: float
    weight: float
    description: Optional[str] = None

    class Config:
        from_attributes = True

class FlawSegmentResponse(BaseModel):
    id: str
    start: float
    end: float
    duration: float
    type: str
    severity: str
    transcript: Optional[str] = None
    cause: str
    effect: str
    recommendation: str
    metrics: Any = {}

class SentenceAnalysisItem(BaseModel):
    id: Optional[str] = None
    sentence_index: int
    text: str
    start_time: float
    end_time: float
    duration: float
    primary_intent: str
    role: str
    semantic_labels: List[Dict[str, Any]] = []
    expected_delivery: Dict[str, Any] = {}
    actual_prosody: Dict[str, Any] = {}
    compatibility_score: float = 100.0

class EvaluationSummary(BaseModel):
    overallScore: float
    similarity: float
    confidence: float
    totalFlaws: int
    strongestArea: Optional[str] = "Vocal Energy"
    weakestArea: Optional[str] = "Pacing"
    detectedSpeakingStyle: Optional[str] = "Persuasive Oratory"
    summaryText: Optional[str] = None

class EvaluationStatusResponse(BaseModel):
    id: str
    status: str
    progress: int = 0
    currentStep: str = "Queued"
    current_step: Optional[str] = None
    overallScore: float = 0.0
    similarity: float = 0.0
    confidence: float = 0.0
    error: Optional[str] = None
    error_message: Optional[str] = None

class EvaluationHistoryItem(BaseModel):
    id: str
    title: str
    createdAt: datetime
    status: str
    progress: int
    overallScore: float
    similarity: float
    totalFlaws: int
    referenceDuration: float = 0.0
    participantDuration: float = 0.0

class EvaluationHistoryResponse(BaseModel):
    items: List[EvaluationHistoryItem]
    total: int

class FeatureTimeSeriesResponse(BaseModel):
    timePoints: List[float]
    referenceFeatures: Dict[str, List[Optional[float]]]
    participantFeatures: Dict[str, List[Optional[float]]]
    deviations: List[float]
    flawRegions: List[Dict[str, Any]]

class ValidationDetailItem(BaseModel):
    expectedType: str
    detectedType: str
    typeMatched: bool
    expectedInterval: str
    detectedInterval: str
    temporalIoU: float
    startTimeErrorSec: float
    endTimeErrorSec: float
    status: str
    expectedSeverity: str
    detectedSeverity: str

class ValidationResultSchema(BaseModel):
    totalExpected: int
    detectedCount: int
    detectionRatePct: float
    typeMatchRatePct: float
    averageTemporalIoU: float
    validationDetails: List[ValidationDetailItem]

class AuditConfigSchema(BaseModel):
    paceThreshold: float
    pitchVarianceThreshold: float
    pauseThreshold: float
    energyThreshold: float
    minFlawDurationSec: float
    flawMergeGapSec: float
    rubricWeights: Dict[str, float]

class EvaluationDetailResponse(BaseModel):
    evaluationId: str
    title: str
    transcript: str
    status: str
    error: Optional[str] = None
    summary: EvaluationSummary
    rubric: Dict[str, float]
    rubricDetails: List[RubricScoreItem]
    flaws: List[FlawSegmentResponse]
    referenceAudioUrl: Optional[str] = None
    participantAudioUrl: str
    referenceDuration: Optional[float] = 0.0
    participantDuration: float
    alignmentWords: List[Dict[str, Any]] = []
    sentences: List[SentenceAnalysisItem] = []
    detectedSpeakingStyle: Optional[str] = "Persuasive Oratory"
    summaryText: Optional[str] = None
    configAudit: Optional[AuditConfigSchema] = None
    groundTruthValidation: Optional[ValidationResultSchema] = None

class DatasetVariantSchema(BaseModel):
    variantName: str
    gradientLevel: str = "MODERATE"
    filePath: str
    speedFactor: float = 1.0
    volumeDeltaDb: float = 0.0
    expectedFlaw: str
    severity: str
    expectedInterval: Optional[str] = None
    description: str

class DatasetItemSchema(BaseModel):
    id: str
    title: str
    transcript: str
    referenceAudioPath: str
    expectedFlaws: List[Dict[str, Any]] = []
    variants: List[DatasetVariantSchema]

class BenchmarkVariantResult(BaseModel):
    variantName: str
    gradientLevel: str
    expectedFlaw: str
    severity: str
    overallScore: float
    similarity: float
    detectedFlawsCount: int
    temporalIoU: float
    status: str
    notes: str

class BenchmarkResponse(BaseModel):
    totalEvaluated: int
    monotonicityPassed: bool
    averageIoU: float
    results: List[BenchmarkVariantResult]

class EvaluateDatasetVariantRequest(BaseModel):
    speechId: Optional[str] = None
    variantName: Optional[str] = None
    variantIndex: Optional[int] = None
