import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProcessingStepper } from '../components/ProcessingStepper';
import { evaluationApi } from '../api/evaluationApi';

export const ProcessingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState<boolean>(true);

  useEffect(() => {
    if (!id) return;

    const interval = setInterval(async () => {
      try {
        const data = await evaluationApi.getEvaluationStatus(id);
        if (data.status === 'COMPLETED') {
          setIsProcessing(false);
          clearInterval(interval);
          navigate(`/results/${id}`);
        } else if (data.status === 'FAILED') {
          clearInterval(interval);
          navigate(`/results/${id}`);
        }
      } catch (err) {
        console.error(err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [id, navigate]);

  return (
    <div className="min-h-screen py-16 px-6 flex items-center justify-center">
      <ProcessingStepper
        isBackendProcessing={isProcessing}
        onComplete={() => id && navigate(`/results/${id}`)}
      />
    </div>
  );
};
