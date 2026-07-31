'use client';

import grapesjs, { type Editor } from 'grapesjs';
import { useEffect, useRef, useState } from 'react';
import 'grapesjs/dist/css/grapes.min.css';
import webpagePlugin from 'grapesjs-preset-webpage';

interface EditorCanvasProps {
  projectId: string;
  initialHtml?: string;
  initialCss?: string;
  onElementSelect?: (element: { id: string; tag: string; path: string[]; html: string }) => void;
  onContentChange?: (html: string, css: string) => void;
}

export function EditorCanvas({
  projectId,
  initialHtml,
  initialCss,
  onElementSelect,
  onContentChange,
}: EditorCanvasProps) {
  const editorRef = useRef<Editor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;

    const editor = grapesjs.init({
      container: containerRef.current,
      height: '100%',
      width: 'auto',
      storageManager: false,
      plugins: [webpagePlugin],
      pluginsOpts: {
        'grapesjs-preset-webpage': {
          blocks: ['column1', 'column2', 'column3', 'text', 'image', 'video', 'map', 'quote'],
          navbarOpts: false,
          countdownOpts: false,
          formsOpts: false,
        },
      },
      canvas: {
        styles: ['https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css'],
      },
      panels: {
        defaults: [
          {
            id: 'basic-actions',
            el: '.panel__basic-actions',
            buttons: [
              {
                id: 'visibility',
                active: true,
                className: 'fa fa-desktop',
                command: 'sw-visibility',
              },
            ],
          },
        ],
      },
      selectorManager: { componentFirst: true },
      styleManager: {
        sectors: [
          {
            name: 'General',
            properties: [
              {
                name: 'Display',
                property: 'display',
                type: 'select',
                defaults: 'block',
                options: [
                  { id: 'block', value: 'block' },
                  { id: 'inline', value: 'inline' },
                  { id: 'inline-block', value: 'inline-block' },
                  { id: 'flex', value: 'flex' },
                  { id: 'none', value: 'none' },
                ],
              },
              { name: 'Position', property: 'position', type: 'select' },
              { name: 'Width', property: 'width', type: 'integer' },
              { name: 'Height', property: 'height', type: 'integer' },
              { name: 'Margin', property: 'margin', type: 'composite' },
              { name: 'Padding', property: 'padding', type: 'composite' },
            ],
          },
          {
            name: 'Tipografía',
            properties: [
              { name: 'Font', property: 'font-family', type: 'select' },
              { name: 'Size', property: 'font-size', type: 'integer' },
              { name: 'Weight', property: 'font-weight', type: 'select' },
              { name: 'Color', property: 'color', type: 'color' },
              { name: 'Align', property: 'text-align', type: 'radio' },
            ],
          },
          {
            name: 'Fondo',
            properties: [
              { name: 'Background', property: 'background-color', type: 'color' },
              { name: 'Background image', property: 'background-image', type: 'file' },
            ],
          },
        ],
      },
    });

    editorRef.current = editor;

    // Load initial content
    editor.on('load', () => {
      if (initialHtml) {
        editor.setComponents(initialHtml);
      }
      if (initialCss) {
        editor.setStyle(initialCss);
      }
      setReady(true);
    });

    // Element selection
    editor.on('component:selected', (component) => {
      if (onElementSelect && component) {
        const el = component.getEl();
        const path = getElementPath(component);
        onElementSelect({
          id: component.getId(),
          tag: component.get('tagName') || 'div',
          path,
          html: el?.outerHTML || component.toHTML(),
        });
      }
    });

    // Content change debounced
    let changeTimer: ReturnType<typeof setTimeout>;
    editor.on('change:changesCount', () => {
      clearTimeout(changeTimer);
      changeTimer = setTimeout(() => {
        if (onContentChange) {
          onContentChange(editor.getHtml(), editor.getCss() || '');
        }
      }, 500);
    });

    return () => {
      clearTimeout(changeTimer);
      editor.destroy();
      editorRef.current = null;
    };
  }, [projectId]); // Only reinit on project change

  // Helper: generate element path
  function getElementPath(component: any): string[] {
    const path: string[] = [];
    let current = component;
    while (current) {
      const tag = current.get('tagName') || 'div';
      const id = current.getId();
      path.unshift(id ? `${tag}#${id}` : tag);
      current = current.parent();
      if (!current || current.get('type') === 'wrapper') break;
    }
    return path;
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" id={`gjs-${projectId}`} />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="text-center">
            <div className="mb-3 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-sm text-muted-foreground">Cargando editor...</p>
          </div>
        </div>
      )}
    </div>
  );
}
