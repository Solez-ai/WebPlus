'use client';

import { useEffect, Suspense, useRef } from 'react';
import { EditorPanel } from '@/components/EditorPanel';
import { PreviewPanel } from '@/components/PreviewPanel';
import { ConsolePanel } from '@/components/ConsolePanel';
import { Toolbar } from '@/components/Toolbar';
import { usePlaygroundState } from '@/hooks/usePlaygroundState';
import { useSearchParams } from 'next/navigation';
import { compileWebPlus } from '@webplus/compiler';

function PlaygroundContent() {
  const { code, setCode, setCompiledCode, addLog } = usePlaygroundState();
  const searchParams = useSearchParams();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const encodedCode = searchParams.get('code');
    if (encodedCode) {
      try {
        const decoded = atob(encodedCode);
        setCode(decoded);
      } catch (err) {
        console.error('Failed to decode share link', err);
      }
    }
  }, [searchParams, setCode]);

  // Auto-compile with debounce
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      try {
        const js = compileWebPlus(code);
        setCompiledCode(js);
      } catch (err: any) {
        // Ignore during typing
      }
    }, 800);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [code, setCompiledCode]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#09090b] text-white">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        <EditorPanel />
        <div className="flex-1 flex flex-col">
          <PreviewPanel />
          <ConsolePanel />
        </div>
      </div>
    </div>
  );
}

export default function Playground() {
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-[#09090b] text-zinc-500 font-mono">Initializing Web+ Playground...</div>}>
      <PlaygroundContent />
    </Suspense>
  );
}
