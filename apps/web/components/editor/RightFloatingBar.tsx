'use client';

import { Button } from '@/components/ui/button';
import { Layers, Redo2, Undo2 } from 'lucide-react';

interface RightFloatingBarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onToggleOutline: () => void;
  showOutline: boolean;
}

export function RightFloatingBar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onToggleOutline,
  showOutline,
}: RightFloatingBarProps) {
  return (
    <div className="fixed right-6 top-1/2 z-50 -translate-y-1/2">
      <div className="flex flex-col gap-1.5 rounded-2xl border bg-card/90 p-1.5 shadow-lg backdrop-blur">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl"
          disabled={!canUndo}
          onClick={onUndo}
          title="Deshacer"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl"
          disabled={!canRedo}
          onClick={onRedo}
          title="Rehacer"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
        <div className="mx-1.5 border-t" />
        <Button
          variant={showOutline ? 'secondary' : 'ghost'}
          size="icon"
          className="h-9 w-9 rounded-xl"
          onClick={onToggleOutline}
          title="Mostrar estructura"
        >
          <Layers className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
