import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from ..database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class Speech(Base):
    __tablename__ = "speeches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    transcript = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    recordings = relationship("Recording", back_populates="speech", cascade="all, delete-orphan")
    evaluations = relationship("Evaluation", back_populates="speech", cascade="all, delete-orphan")


class Recording(Base):
    __tablename__ = "recordings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    speech_id = Column(String(36), ForeignKey("speeches.id"), nullable=False)
    type = Column(String(20), nullable=False)  # "REFERENCE" or "PARTICIPANT"
    file_path = Column(String(500), nullable=False)
    original_filename = Column(String(255), nullable=True)
    duration = Column(Float, nullable=False, default=0.0)
    sample_rate = Column(Integer, default=16000)
    channels = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    speech = relationship("Speech", back_populates="recordings")


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    speech_id = Column(String(36), ForeignKey("speeches.id"), nullable=False)
    reference_recording_id = Column(String(36), ForeignKey("recordings.id"), nullable=False)
    participant_recording_id = Column(String(36), ForeignKey("recordings.id"), nullable=False)
    
    overall_score = Column(Float, default=0.0)
    similarity = Column(Float, default=0.0)
    confidence = Column(Float, default=0.0)
    status = Column(String(20), default="QUEUED")  # "QUEUED", "PROCESSING", "COMPLETED", "FAILED"
    progress = Column(Integer, default=0)
    current_step = Column(String(100), default="Queued")
    error_message = Column(Text, nullable=True)
    
    strongest_area = Column(String(100), nullable=True)
    weakest_area = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    speech = relationship("Speech", back_populates="evaluations")
    reference_recording = relationship("Recording", foreign_keys=[reference_recording_id])
    participant_recording = relationship("Recording", foreign_keys=[participant_recording_id])
    
    rubric_scores = relationship("RubricScore", back_populates="evaluation", cascade="all, delete-orphan")
    flaw_segments = relationship("FlawSegment", back_populates="evaluation", cascade="all, delete-orphan")
    features = relationship("EvaluationFeatures", back_populates="evaluation", uselist=False, cascade="all, delete-orphan")


class RubricScore(Base):
    __tablename__ = "rubric_scores"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    evaluation_id = Column(String(36), ForeignKey("evaluations.id"), nullable=False)
    category = Column(String(50), nullable=False)
    score = Column(Float, nullable=False)
    weight = Column(Float, nullable=False)
    description = Column(String(255), nullable=True)

    evaluation = relationship("Evaluation", back_populates="rubric_scores")


class FlawSegment(Base):
    __tablename__ = "flaw_segments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    evaluation_id = Column(String(36), ForeignKey("evaluations.id"), nullable=False)
    flaw_type = Column(String(50), nullable=False)
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=False)
    duration = Column(Float, nullable=False)
    severity = Column(String(20), nullable=False)  # "LOW", "MEDIUM", "HIGH"
    transcript_snippet = Column(Text, nullable=True)
    cause = Column(Text, nullable=False)
    effect = Column(Text, nullable=False)
    recommendation = Column(Text, nullable=False)
    metrics_json = Column(Text, nullable=False)  # JSON-encoded dict of exact numbers

    evaluation = relationship("Evaluation", back_populates="flaw_segments")


class EvaluationFeatures(Base):
    __tablename__ = "evaluation_features"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    evaluation_id = Column(String(36), ForeignKey("evaluations.id"), nullable=False)
    time_points_json = Column(Text, nullable=False)
    reference_features_json = Column(Text, nullable=False)
    participant_features_json = Column(Text, nullable=False)
    deviations_json = Column(Text, nullable=False)
    alignment_words_json = Column(Text, nullable=True, default="[]")

    evaluation = relationship("Evaluation", back_populates="features")
