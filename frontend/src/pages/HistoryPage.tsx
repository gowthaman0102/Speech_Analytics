import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Plus, Trash2, ArrowUpRight, Loader2, AlertCircle } from 'lucide-react';
import { evaluationApi } from '../api/evaluationApi';
import type { EvaluationHistoryItem } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<EvaluationHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await evaluationApi.getEvaluationsHistory();
      setItems(data.items);
    } catch (err: unknown) {
      console.error('Failed to load history:', err);
      setError('Unable to retrieve evaluation history. Please ensure the server is active.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this evaluation report?')) {
      return;
    }

    try {
      setDeletingId(id);
      await evaluationApi.deleteEvaluation(id);
      setItems((prev) => prev.filter((item) => String(item.id) !== String(id)));
    } catch (err) {
      console.error('Failed to delete evaluation:', err);
      alert('Could not delete evaluation.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">Completed</Badge>;
      case 'PROCESSING':
        return <Badge variant="accent">Processing</Badge>;
      case 'FAILED':
        return <Badge variant="danger">Failed</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 md:py-14 space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
            Evaluation history
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Review past speech delivery reports, rubric scores, and coaching notes.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate('/evaluate')}
          className="flex items-center gap-2 text-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New evaluation</span>
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <AlertCircle className="w-8 h-8 text-danger mx-auto mb-2" />
          <p className="text-sm font-bold text-text">{error}</p>
          <Button variant="secondary" onClick={fetchHistory} className="mt-4 text-xs">
            Retry
          </Button>
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No evaluations recorded yet"
          description="Upload a speech recording to see sub-second timestamps, delivery scores, and coaching suggestions."
          action={
            <Button variant="primary" onClick={() => navigate('/evaluate')} className="text-xs">
              Start an evaluation
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-text-muted text-xs font-semibold">
                  <th className="py-3 px-5">Speech title</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Delivery score</th>
                  <th className="py-3 px-5">Flagged moments</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => {
                  const score = item.overallScore ?? item.overall_score ?? null;
                  const flawsCount = item.totalFlaws ?? item.flaw_count ?? 0;
                  const dateStr = item.createdAt || item.created_at || '';

                  return (
                    <tr
                      key={item.id}
                      onClick={() => {
                        if (item.status === 'COMPLETED') {
                          navigate(`/results/${item.id}`);
                        } else if (item.status === 'PROCESSING') {
                          navigate(`/processing/${item.id}`);
                        }
                      }}
                      className="hover:bg-surface-2 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-5">
                        <div className="font-bold text-text">{item.title}</div>
                      </td>
                      <td className="py-4 px-5 text-text-muted whitespace-nowrap text-xs">
                        {formatDate(dateStr)}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap tabular-nums">
                        {score !== null ? (
                          <span className="font-bold text-text">
                            {Math.round(score)}
                            <span className="text-xs text-text-muted font-normal"> / 100</span>
                          </span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="py-4 px-5 whitespace-nowrap text-text-muted tabular-nums">
                        {flawsCount}
                      </td>
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              if (item.status === 'COMPLETED') {
                                navigate(`/results/${item.id}`);
                              } else {
                                navigate(`/processing/${item.id}`);
                              }
                            }}
                            className="text-xs p-2 flex items-center gap-1 text-accent"
                            title="Open report"
                          >
                            <span>Open</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={(e) => handleDelete(String(item.id), e)}
                            disabled={deletingId === String(item.id)}
                            className="text-xs p-2 text-danger hover:text-danger"
                            title="Delete evaluation"
                          >
                            {deletingId === String(item.id) ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
