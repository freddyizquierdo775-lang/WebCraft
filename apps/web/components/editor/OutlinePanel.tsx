'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  ChevronRight,
  Image,
  Layout,
  Link,
  List,
  Square,
  Table2,
  Type,
} from 'lucide-react';
import { useState } from 'react';

// Mock tree nodes — in production this comes from GrapesJS component tree
interface TreeNode {
  id: string;
  tag: string;
  label: string;
  children: TreeNode[];
  selected: boolean;
}

const TAG_ICONS: Record<string, React.ReactNode> = {
  div: <Square className="h-3.5 w-3.5 text-muted-foreground" />,
  section: <Layout className="h-3.5 w-3.5 text-blue-500" />,
  header: <Layout className="h-3.5 w-3.5 text-blue-500" />,
  footer: <Layout className="h-3.5 w-3.5 text-blue-500" />,
  nav: <Layout className="h-3.5 w-3.5 text-purple-500" />,
  h1: <Type className="h-3.5 w-3.5 text-foreground" />,
  h2: <Type className="h-3.5 w-3.5 text-foreground" />,
  h3: <Type className="h-3.5 w-3.5 text-foreground" />,
  p: <Type className="h-3.5 w-3.5 text-muted-foreground" />,
  span: <Type className="h-3.5 w-3.5 text-muted-foreground" />,
  img: <Image className="h-3.5 w-3.5 text-green-500" />,
  a: <Link className="h-3.5 w-3.5 text-purple-500" />,
  ul: <List className="h-3.5 w-3.5 text-orange-500" />,
  ol: <List className="h-3.5 w-3.5 text-orange-500" />,
  li: <List className="h-3.5 w-3.5 text-muted-foreground" />,
  table: <Table2 className="h-3.5 w-3.5 text-cyan-500" />,
  button: <Square className="h-3.5 w-3.5 text-primary" />,
  form: <Square className="h-3.5 w-3.5 text-yellow-500" />,
};

interface OutlinePanelProps {
  tree: TreeNode[];
  onSelectNode: (nodeId: string) => void;
  selectedId: string | null;
}

function TreeNodeItem({
  node,
  depth,
  onSelect,
  selectedId,
}: {
  node: TreeNode;
  depth: number;
  onSelect: (id: string) => void;
  selectedId: string | null;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children.length > 0;
  const isSelected = node.id === selectedId;

  return (
    <div>
      <button
        onClick={() => onSelect(node.id)}
        onDoubleClick={() => hasChildren && setExpanded(!expanded)}
        className={cn(
          'flex w-full items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors hover:bg-muted',
          isSelected && 'bg-primary/10 text-primary font-medium',
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="flex-shrink-0 cursor-pointer"
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </span>
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}
        <span className="flex-shrink-0">
          {TAG_ICONS[node.tag] || <Square className="h-3.5 w-3.5 text-muted-foreground" />}
        </span>
        <span className="truncate">
          <span className="text-[10px] text-muted-foreground">&lt;{node.tag}&gt;</span>
          {node.label && <span className="ml-1">{node.label}</span>}
        </span>
      </button>
      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function OutlinePanel({ tree, onSelectNode, selectedId }: OutlinePanelProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-shrink-0 pb-2">
        <CardTitle className="text-sm">Estructura</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="py-2">
            {tree.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                No hay elementos en el canvas
              </p>
            ) : (
              tree.map((node) => (
                <TreeNodeItem
                  key={node.id}
                  node={node}
                  depth={0}
                  onSelect={onSelectNode}
                  selectedId={selectedId}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
