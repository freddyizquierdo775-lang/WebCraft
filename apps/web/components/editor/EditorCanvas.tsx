'use client';

// EditorCanvas será reemplazado por AstRenderer en Fase 2 — stub temporal

interface EditorCanvasProps {
  onElementSelect?: (el: { id: string; tag: string; path: string[]; html: string }) => void;
  onContentChange?: (html: string, css: string) => void;
  html?: string;
  css?: string;
  projectId?: string;
}

export function EditorCanvas(_props: EditorCanvasProps) {
  return (
    <div className="flex h-full items-center justify-center border border-dashed border-muted-foreground/30 rounded-lg bg-muted/10">
      <p className="text-sm text-muted-foreground">Lienzo AST — pendiente de Fase 2</p>
    </div>
  );
}
