'use client';

import { Button } from '@/components/ui/button';
import { ArrowUp, Sparkles } from 'lucide-react';
import { useCallback, useState } from 'react';

interface BottomAIPanelProps {
  onSubmit: (prompt: string) => void;
  loading?: boolean;
}

export function BottomAIPanel({ onSubmit, loading }: BottomAIPanelProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = useCallback(() => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
    setPrompt('');
  }, [prompt, loading, onSubmit]);

  return (
    <div className="fixed bottom-8 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2">
      <div className="mx-4 rounded-2xl border bg-card/95 shadow-2xl shadow-purple-500/10 backdrop-blur">
        <div className="flex items-center gap-3 p-3">
          <Sparkles className="h-5 w-5 flex-shrink-0 text-purple-500" />
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Describe qué quieres cambiar en la sección seleccionada..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
          <Button
            size="icon"
            className="h-9 w-9 rounded-xl flex-shrink-0"
            disabled={!prompt.trim() || loading}
            onClick={handleSubmit}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
