'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, Brush, Copy, Sparkles, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';

interface CanvasSectionPanelProps {
  sectionId: string;
  sectionName: string;
  isSelected: boolean;
  onSelect: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDuplicate?: () => void;
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
  onDuplicate,
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
        'group relative rounded-2xl bg-white shadow-sm transition-all duration-200',
        'border-2',
        editMode && 'cursor-pointer border-dashed border-gray-300 hover:border-gray-500',
        isSelected && editMode && 'border-purple-500 border-solid shadow-lg shadow-purple-500/10',
      )}
    >
      {/* Section label — always visible when selected, on hover otherwise */}
      {editMode && (
        <div
          className={cn(
            'absolute -top-3.5 left-3 z-10 rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 shadow-sm border transition-opacity',
            isSelected
              ? 'border-purple-300 text-purple-600 opacity-100'
              : 'border-gray-200 opacity-0 group-hover:opacity-100',
          )}
        >
          {sectionName}
        </div>
      )}

      {/* Floating toolbar — appears on select */}
      {editMode && isSelected && (
        <div className="absolute -top-10 right-3 z-20 flex items-center gap-0.5 rounded-lg border bg-white px-1 py-0.5 shadow-lg">
          {onAIEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-purple-600 hover:bg-purple-50"
              onClick={(e) => {
                e.stopPropagation();
                setShowAIPrompt(!showAIPrompt);
              }}
              title="Editar con IA"
            >
              <Sparkles className="h-3 w-3" /> IA
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={(e) => {
              e.stopPropagation(); /* future: styles panel */
            }}
            title="Estilos"
          >
            <Brush className="h-3 w-3" /> Estilos
          </Button>
          {onDuplicate && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              title="Duplicar"
            >
              <Copy className="h-3 w-3" /> Duplicar
            </Button>
          )}
          {onMoveUp && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              title="Subir"
            >
              <ArrowUp className="h-3 w-3" />
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
              title="Bajar"
            >
              <ArrowDown className="h-3 w-3" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Eliminar"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}

          {/* AI Prompt popover */}
          {showAIPrompt && (
            <div className="absolute right-0 top-10 z-30 w-72 rounded-xl border bg-white p-3 shadow-xl">
              <textarea
                value={aiPromptText}
                onChange={(e) => setAiPromptText(e.target.value)}
                placeholder="Describe qué quieres cambiar..."
                className="w-full resize-none rounded-lg border bg-gray-50 p-2 text-xs outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAIEdit();
                  }
                }}
              />
              <div className="mt-2 flex justify-end gap-1">
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

      {/* Content — pointer-events disabled in edit mode to intercept all clicks */}
      <div className={cn('rounded-xl overflow-hidden', editMode && 'pointer-events-none')}>
        {children}
      </div>
    </div>
  );
}
