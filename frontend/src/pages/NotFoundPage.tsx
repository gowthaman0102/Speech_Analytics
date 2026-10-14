import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-6 text-center">
      <Card className="max-w-md w-full p-8 text-center">
        <FileQuestion className="w-10 h-10 text-[var(--muted-foreground)] mx-auto mb-3" />
        <h1 className="text-xl font-serif font-bold text-[var(--foreground)] tracking-tight">
          Page Not Found
        </h1>
        <p className="text-xs text-[var(--muted-foreground)] mt-2 leading-relaxed">
          The requested page does not exist or may have been relocated.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="primary"
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return Home</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/evaluations')}
            className="text-xs"
          >
            Evaluations
          </Button>
        </div>
      </Card>
    </div>
  );
};
