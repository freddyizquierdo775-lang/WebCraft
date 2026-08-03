'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, Sparkles, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';

interface CanvasSectionPanelProps {
  sectionId: string;
  sectionName: string;
  isSelected: boolean;
  onSelect: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
  onAIEdit?: (prompt: string) => void;
  editMode: boolean;
  children: React.ReactNode;
}

export function CanvasSectionPanel({
  sectionId,
  sectionName,
  isSelected,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDelete,
  onAIEdit,
  editMode,
  children,
}: CanvasSectionPanelProps) {
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [aiPromptText, setAiPromptText] = useState('');

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!editMode) return;
      e.stopPropagation();
      e.preventDefault();
      onSelect();
    },
    [editMode, onSelect],
  );

  const handleAIEdit = useCallback(() => {
    if (aiPromptText.trim() && onAIEdit) {
      onAIEdit(aiPromptText.trim());
      setAiPromptText('');
      setShowAIPrompt(false);
    }
  }, [aiPromptText, onAIEdit]);

  return (
    <div
      data-section-id={sectionId}
      onClick={handleClick}
      onKeyDown={handleClick as unknown as React.KeyboardEventHandler}
      className={cn(
        'group relative transition-all duration-200',
        editMode && 'cursor-pointer',
        isSelected && editMode && 'ring-2 ring-purple-500 ring-offset-2 rounded-lg',
        editMode && 'hover:ring-1 hover:ring-purple-400/40 rounded-lg',
      )}
    >
      {/* Section label */}
      {editMode && (
        <div className="absolute -top-3 left-3 z-10 flex items-center gap-1 rounded-full border bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground shadow-sm opacity-0 transition-opacity group-hover:opacity-100">
          {sectionName}
        </div>
      )}

      {/* Floating toolbar — visible on hover when selected */}
      {editMode && isSelected && (
        <div className="absolute -top-10 right-2 z-20 flex items-center gap-1 rounded-lg border bg-card p-1 shadow-lg">
          {onMoveUp && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              title="Subir sección"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
          )}
          {onMoveDown && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              title="Bajar sección"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
          )}
          {onAIEdit && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAIPrompt(!showAIPrompt);
                }}
                title="Editar con IA"
              >
                <Sparkles className="h-3.5 w-3.5" />
              </Button>
              {showAIPrompt && (
                <div className="absolute right-0 top-9 z-30 w-64 rounded-xl border bg-card p-2 shadow-xl">
                  <textarea
                    value={aiPromptText}
                    onChange={(e) => setAiPromptText(e.target.value)}
                    placeholder="¿Qué quieres cambiar en esta sección?"
                    className="w-full resize-none rounded-lg border bg-muted/50 p-2 text-xs outline-none"
                    rows={3}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAIEdit();
                      }
                    }}
                  />
                  <div className="mt-1 flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAIPrompt(false);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      className="h-6 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAIEdit();
                      }}
                      disabled={!aiPromptText.trim()}
                    >
                      Enviar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Eliminar sección"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}

      {/* Children */}
      <div className={cn(editMode && 'pointer-events-none')}>{children}</div>
    </div>
  );
}
