import React, { useEffect, useState } from 'react';
import { Search, Loader2, Music, User } from 'lucide-react';
import { evaluationApi } from '../api/evaluationApi';
import type { DatasetItem } from '../types';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';

export const DatasetPage: React.FC = () => {
  const [dataset, setDataset] = useState<DatasetItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    evaluationApi.getDataset()
      .then((ds) => setDataset(ds))
      .catch((err) => console.error('Failed to load dataset:', err))
      .finally(() => setLoading(false));
  }, []);

  const categories = ['ALL', ...Array.from(new Set(dataset.map((d) => d.category || 'Oratory')))];

  const filteredItems = dataset.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.speaker && item.speaker.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.transcript && item.transcript.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin mb-3" />
        <h2 className="text-base font-bold text-text">
          Loading sample recordings
        </h2>
        <p className="text-xs text-text-muted mt-1">
          Reading benchmark reference speeches...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 md:py-14 space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
            Sample recordings
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Browse reference recordings and speech examples used across our evaluation benchmarks.
          </p>
        </div>
        <Badge variant="teal" size="sm">
          {dataset.length} recordings available
        </Badge>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search by title, speaker, or keyword…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap self-start sm:self-auto text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-accent text-white shadow-2xs'
                  : 'bg-surface-2 text-text-muted hover:text-text border border-border'
              }`}
            >
              {cat === 'ALL' ? 'All categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <Card className="p-10 text-center text-text-muted">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="font-bold text-text">No recordings match your search</p>
            <p className="text-xs mt-1">Try a different keyword or reset filters.</p>
          </Card>
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id} className="p-6 transition-all hover:border-border-strong">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="accent" size="sm">
                      {item.category || 'Oratory'}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-text">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-text-muted mt-1 font-medium">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-text-muted" />
                      <span>Speaker: {item.speaker || 'Standard Orator'}</span>
                    </span>
                    {item.variants && item.variants.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Music className="w-3.5 h-3.5 text-text-muted" />
                        <span>{item.variants.length} delivery variations</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Reference Audio Player */}
                {item.referenceAudioUrl && (
                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-surface-2 border border-border shrink-0">
                    <span className="text-xs font-bold text-text-muted">Audio preview:</span>
                    <audio controls src={item.referenceAudioUrl} className="h-8 w-52" preload="none" />
                  </div>
                )}
              </div>

              {/* Transcript Snippet */}
              {item.transcript && (
                <div className="mt-4 p-4 rounded-xl bg-surface-2 border border-border text-xs text-text leading-relaxed">
                  <p className="text-text-muted font-bold mb-1">Transcript snippet:</p>
                  <p className="italic font-medium">"{item.transcript}"</p>
                </div>
              )}

              {/* Delivery Variations Preview (Read-only catalog preview) */}
              {item.variants && item.variants.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border">
                  <h4 className="text-xs font-bold text-text-muted mb-2.5">
                    Included delivery variations:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {item.variants.map((v, vIdx) => (
                      <div
                        key={vIdx}
                        className="p-3 rounded-xl border border-border bg-surface flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1.5 mb-1">
                            <span className="font-bold text-xs text-text">
                              {v.variantName || v.name || `Variation ${vIdx + 1}`}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-2 text-text-muted border border-border">
                              {v.gradientLevel || v.tier || 'Sample'}
                            </span>
                          </div>
                          <p className="text-xs text-text-muted leading-relaxed">
                            {v.description}
                          </p>
                        </div>
                        {v.audioUrl && (
                          <div className="mt-2.5 pt-2 border-t border-border">
                            <audio controls src={v.audioUrl} className="h-7 w-full" preload="none" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
