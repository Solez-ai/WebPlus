'use client';

import { usePlaygroundState } from '@/hooks/usePlaygroundState';
import { Terminal, Trash2 } from 'lucide-react';

export const ConsolePanel = () => {
    const { logs, clearLogs } = usePlaygroundState();

    return (
        <div className="h-48 border-t border-zinc-800 bg-[#0c0c0e] flex flex-col font-mono">
            <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                    <Terminal size={14} />
                    <span>CONSOLE</span>
                </div>
                <button
                    onClick={clearLogs}
                    className="hover:text-white transition-colors p-1"
                    title="Clear Console"
                >
                    <Trash2 size={14} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1 text-sm">
                {logs.filter(log => !log.message.includes("wallet status") && !log.message.includes("ethereum")).length === 0 ? (
                    <span className="text-zinc-600 italic">No output...</span>
                ) : (
                    logs.filter(log => !log.message.includes("wallet status") && !log.message.includes("ethereum")).map((log, i) => (
                        <div key={i} className="flex gap-2">
                            <span className="text-zinc-600">[{log.timestamp}]</span>
                            <span className={
                                log.type === 'error' ? 'text-red-400' :
                                    log.type === 'warn' ? 'text-yellow-400' :
                                        'text-zinc-300'
                            }>
                                {log.message}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
