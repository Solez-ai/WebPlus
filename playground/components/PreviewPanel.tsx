'use client';

import { useEffect, useRef } from 'react';
import { usePlaygroundState } from '@/hooks/usePlaygroundState';

export const PreviewPanel = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { compiledCode } = usePlaygroundState();

  useEffect(() => {
    if (iframeRef.current && compiledCode) {
      const blob = new Blob([`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { 
                font-family: system-ui, -apple-system, sans-serif; 
                color: #fff; 
                background: #09090b; 
                margin: 0;
                padding: 1rem;
              }
              h1 { color: #3b82f6; }
            </style>
          </head>
          <body>
            <div id="app"></div>
            <script>
              const _log = console.log;
              const _warn = console.warn;
              const _error = console.error;

              function sendToParent(type, args) {
                window.parent.postMessage({ 
                  type: 'console', 
                  method: type, 
                  message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') 
                }, '*');
              }

              console.log = (...args) => { _log(...args); sendToParent('log', args); };
              console.warn = (...args) => { _warn(...args); sendToParent('warn', args); };
              console.error = (...args) => { _error(...args); sendToParent('error', args); };

              window.onerror = (msg, url, line, col, error) => {
                sendToParent('error', [msg + ' (line ' + line + ')']);
                return false;
              };

              (async () => {
                try {
                  ${compiledCode}
                } catch (err) {
                  console.error(err);
                }
              })();
            </script>
          </body>
        </html>
      `], { type: 'text/html' });

      const url = URL.createObjectURL(blob);
      iframeRef.current.src = url;

      return () => URL.revokeObjectURL(url);
    }
  }, [compiledCode]);

  return (
    <div className="h-full w-full bg-[#09090b] flex flex-col">
      <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400 font-mono">
        <span>LIVE PREVIEW</span>
      </div>
      <div className="flex-1">
        <iframe
          ref={iframeRef}
          className="w-full h-full border-none"
          sandbox="allow-scripts"
          title="Web+ Preview"
        />
      </div>
    </div>
  );
};
