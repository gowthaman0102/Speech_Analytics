import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 text-center">
      <Card className="max-w-md w-full p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center mx-auto text-text-muted">
          <FileQuestion className="w-6 h-6 text-accent" />
        </div>
        <h1 className="text-2xl font-extrabold text-text tracking-tight">
          Page not found
        </h1>
        <p className="text-sm text-text-muted leading-relaxed">
          The requested page does not exist or may have been relocated.
        </p>

        <div className="pt-2 flex items-center justify-center gap-3">
          <Button
            variant="primary"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to overview</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/evaluations')}
            className="text-xs"
          >
            History
          </Button>
        </div>
      </Card>
    </div>
  );
};
