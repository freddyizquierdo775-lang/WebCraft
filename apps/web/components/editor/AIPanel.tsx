'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ArrowRight, Check, Code, Loader2, RotateCcw, Sparkles, X } from 'lucide-react';
import { useState } from 'react';

interface SelectedElement {
  id: string;
  tag: string;
  path: string[];
  html: string;
}

interface EditHistoryItem {
  id: string;
  prompt: string;
  diff: string;
  timestamp: number;
  applied: boolean;
}

interface AIPanelProps {
  selectedElement: SelectedElement | null;
  projectId: string;
  onApplyEdit: (html: string, diff: string) => void;
  credits: number;
}

export function AIPanel({ selectedElement, projectId, onApplyEdit, credits }: AIPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ html: string; diff: string; explanation: string } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<EditHistoryItem[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim() || !selectedElement) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/v1/projects/${projectId}/granular-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          element_id: selectedElement.id,
          element_path: selectedElement.path.join(' > '),
          element_html: selectedElement.html,
          prompt: prompt.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Error en la edición');
      }

      const data = await res.json();
      if (data.success) {
        setResult({
          html: data.data.modified_html,
          diff: data.data.diff,
          explanation: data.data.explanation || 'Edición aplicada exitosamente.',
        });
        setHistory((prev) => [
          {
            id: crypto.randomUUID(),
            prompt: prompt.trim(),
            diff: data.data.diff,
            timestamp: Date.now(),
            applied: false,
          },
          ...prev,
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onApplyEdit(result.html, result.diff);
      setHistory((prev) => prev.map((h, i) => (i === 0 ? { ...h, applied: true } : h)));
      setResult(null);
      setPrompt('');
    }
  };

  const handleCancel = () => {
    setResult(null);
  };

  const examples = [
    'Cambia el color de fondo a #1a1a2e y agrega un borde redondeado',
    'Haz este texto más grande y en negritas',
    'Agrega una sombra suave y padding de 1rem',
    'Convierte esto en un grid de 3 columnas',
    'Cambia el texto a "Bienvenidos a nuestro sitio"',
  ];

  if (!selectedElement) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Code className="mb-4 h-12 w-12 text-muted-foreground/30" />
          <p className="text-center text-sm text-muted-foreground">
            Selecciona un elemento en el canvas para editarlo con IA
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Selected element info */}
      <div className="border-b p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="font-mono text-xs">
            &lt;{selectedElement.tag}&gt;
          </Badge>
          <span className="text-xs text-muted-foreground truncate">{selectedElement.id}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate font-mono">
          {selectedElement.path.join(' > ')}
        </p>
      </div>

      {/* Prompt input */}
      <div className="border-b p-4">
        <label className="mb-2 block text-sm font-medium">¿Qué quieres cambiar?</label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe el cambio que quieres hacer a este elemento..."
          rows={3}
          className="mb-2 resize-none text-sm"
          disabled={loading}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">🪙 ~1-3 créditos</span>
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="gap-1"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {loading ? 'Editando...' : 'Editar con IA'}
          </Button>
        </div>
      </div>

      {/* Result */}
      {error && (
        <div className="border-b p-4">
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <X className="mt-0.5 h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        </div>
      )}

      {result && (
        <div className="border-b p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Check className="h-4 w-4" />
            {result.explanation}
          </div>

          {result.diff && (
            <div className="rounded-lg bg-muted p-3">
              <p className="mb-1 text-xs font-medium text-muted-foreground">Diff:</p>
              <pre className="max-h-32 overflow-auto text-xs font-mono whitespace-pre-wrap">
                {result.diff}
              </pre>
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" onClick={handleApply} className="flex-1 gap-1">
              <Check className="h-3.5 w-3.5" />
              Aplicar
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel} className="gap-1">
              <RotateCcw className="h-3.5 w-3.5" />
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Examples */}
      {!result && !loading && (
        <div className="p-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Ejemplos:</p>
          <div className="space-y-1">
            {examples.map((ex, i) => (
              <button
                key={i}
                onClick={() => setPrompt(ex)}
                className="block w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors truncate rounded px-2 py-1 hover:bg-muted"
              >
                <ArrowRight className="mr-1 inline h-3 w-3" />
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="flex-1 overflow-hidden">
          <div className="border-b px-4 py-2">
            <p className="text-xs font-medium text-muted-foreground">Historial</p>
          </div>
          <ScrollArea className="h-full">
            <div className="space-y-1 p-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    'rounded-lg px-3 py-2 text-xs',
                    item.applied ? 'bg-primary/5' : 'bg-muted',
                  )}
                >
                  <p className="truncate font-medium">{item.prompt}</p>
                  <p className="text-muted-foreground">
                    {new Date(item.timestamp).toLocaleTimeString()}
                    {item.applied && ' · Aplicado'}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Credits */}
      <div className="mt-auto border-t p-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Créditos disponibles</span>
          <span className="font-medium text-foreground">{credits}</span>
        </div>
      </div>
    </div>
  );
}
