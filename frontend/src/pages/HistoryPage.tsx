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
      setError('Unable to retrieve evaluations history. Please check that the server is active.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete evaluation #${id}? This action cannot be undone.`)) {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
              Assessment Archives
            </span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[var(--foreground)] tracking-tight">
            Evaluation History
          </h1>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Review past contrastive speech evaluations, rubric scores, and temporal flaw reports.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => navigate('/evaluate')}
          className="flex items-center gap-2 text-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Evaluation</span>
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
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-[var(--foreground)]">{error}</p>
          <Button variant="secondary" onClick={fetchHistory} className="mt-4 text-xs">
            Retry
          </Button>
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No evaluations recorded yet"
          description="Submit participant and reference audio on the evaluation page or launch a demo dataset variant to see results."
          action={
            <Button variant="primary" onClick={() => navigate('/evaluate')} className="text-xs">
              Start Evaluation
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted-foreground)] uppercase text-[10px] font-mono tracking-wider">
                  <th className="py-3 px-4">Evaluation</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Overall Score</th>
                  <th className="py-3 px-4">Flaws Identified</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
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
                      className="hover:bg-[var(--surface-2)]/70 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-[var(--foreground)]">{item.title}</div>
                        <div className="text-[11px] font-mono text-[var(--muted-foreground)]">#{item.id}</div>
                      </td>
                      <td className="py-3 px-4 text-[var(--muted-foreground)] whitespace-nowrap">
                        {formatDate(dateStr)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono font-medium">
                        {score !== null ? (
                          <span className="text-[var(--foreground)]">
                            {Math.round(score)}
                            <span className="text-[10px] text-[var(--muted-foreground)]"> / 100</span>
                          </span>
                        ) : (
                          <span className="text-[var(--muted-foreground)]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-[var(--muted-foreground)] font-mono">
                        {flawsCount}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
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
                            className="text-xs p-1.5 flex items-center gap-1 text-[var(--accent)]"
                            title="Open details"
                          >
                            <span>Open</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={(e) => handleDelete(String(item.id), e)}
                            disabled={deletingId === String(item.id)}
                            className="text-xs p-1.5 text-rose-600 hover:text-rose-800"
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
