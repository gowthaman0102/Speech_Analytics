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
    metrics: Dict[str, Any]

class EvaluationSummary(BaseModel):
    overallScore: float
    similarity: float
    confidence: float
    totalFlaws: int
    strongestArea: Optional[str] = "Vocal Energy"
    weakestArea: Optional[str] = "Pacing"

class FeatureTimeSeriesResponse(BaseModel):
    timePoints: List[float]
    referenceFeatures: Dict[str, List[Optional[float]]]
    participantFeatures: Dict[str, List[Optional[float]]]
    deviations: List[float]
    flawRegions: List[Dict[str, Any]]

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
    referenceAudioUrl: str
    participantAudioUrl: str
    referenceDuration: float
    participantDuration: float
    alignmentWords: List[Dict[str, Any]] = []

class DatasetVariantSchema(BaseModel):
    variantName: str
    filePath: str
    expectedFlaw: str
    severity: str
    description: str

class DatasetItemSchema(BaseModel):
    id: str
    title: str
    transcript: str
    referenceAudioPath: str
    variants: List[DatasetVariantSchema]
