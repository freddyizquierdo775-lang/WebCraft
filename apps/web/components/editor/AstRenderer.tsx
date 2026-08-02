'use client';

import { useEditorStore } from '@/stores/editor-store';
import type { ASTNode } from '@/types/ast';
import { createElement, useCallback } from 'react';

interface AstRendererProps {
  node: ASTNode;
}

function styleRecordToString(styles: Record<string, string>): string | undefined {
  const entries = Object.entries(styles);
  if (entries.length === 0) return undefined;
  return entries.map(([k, v]) => `${k}:${v}`).join(';');
}

export function AstRenderer({ node }: AstRendererProps) {
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const selectElement = useEditorStore((s) => s.selectElement);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      selectElement(node.id);
    },
    [node.id, selectElement],
  );

  const isSelected = node.id === selectedElementId;
  const className = [
    ...node.classes,
    isSelected ? 'ring-2 ring-purple-500 ring-offset-1' : '',
    'cursor-pointer transition-all duration-150 hover:ring-1 hover:ring-purple-400/50',
  ]
    .filter(Boolean)
    .join(' ');

  const children = node.children?.map((child) => <AstRenderer key={child.id} node={child} />);

  return createElement(
    node.tag,
    {
      className,
      style: styleRecordToString(node.styles),
      onClick: handleClick,
      'data-ast-id': node.id,
    },
    node.text,
    ...(children ?? []),
  );
}
