'use client';

import { useEditorStore } from '@/stores/editor-store';
import type { ASTNode } from '@/types/ast';
import { createElement, useCallback } from 'react';

interface AstRendererProps {
  node: ASTNode;
  editMode?: boolean;
}

function styleRecordToString(styles: Record<string, string>): string | undefined {
  const entries = Object.entries(styles);
  if (entries.length === 0) return undefined;
  return entries.map(([k, v]) => `${k}:${v}`).join(';');
}

export function AstRenderer({ node, editMode = true }: AstRendererProps) {
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const selectElement = useEditorStore((s) => s.selectElement);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!editMode) return;
      e.stopPropagation();
      e.preventDefault();
      selectElement(node.id);
    },
    [node.id, selectElement, editMode],
  );

  const isSelected = editMode && node.id === selectedElementId;
  const className = [
    ...node.classes,
    isSelected ? 'ring-2 ring-purple-500 ring-offset-1' : '',
    editMode
      ? 'cursor-pointer transition-all duration-150 hover:ring-1 hover:ring-purple-400/50'
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Wrap children in pointer-events-none when in edit mode to prevent native link/button clicks
  const children = node.children?.map((child) => (
    <AstRenderer key={child.id} node={child} editMode={editMode} />
  ));

  return createElement(
    node.tag,
    {
      className,
      style: styleRecordToString(node.styles),
      onClick: handleClick,
      'data-ast-id': node.id,
      ...(editMode ? { 'data-editor-block': 'true' } : {}),
    },
    node.text,
    ...(children ?? []),
  );
}
