'use client';

import { usePlaygroundState } from '@/hooks/usePlaygroundState';
import { Play, RotateCcw, Download, Copy, Sun, Moon } from 'lucide-react';
import { compileWebPlus } from '@webplus/compiler';

export const Toolbar = () => {
    const { code, setCode, setCompiledCode, addLog, theme, toggleTheme } = usePlaygroundState();

    const handleRun = () => {
        try {
            addLog('log', 'Compiling Web+...');
            const js = compileWebPlus(code);
            setCompiledCode(js);
            addLog('log', 'Build successful! Executing...');
        } catch (err: any) {
            addLog('error', `Compilation error: ${err.message}`);
        }
    };

    const handleReset = () => {
        setCode(`// Web+ Hello World Example
// This demonstrates basic DOM manipulation with Web+

void main() {
    dom::Element app = dom::get("#app");
    app.text("Hello, Web+!");
}`);
    };

    const handleDownload = () => {
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'project.webplus';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleCopyLink = () => {
        const encoded = btoa(code);
        const url = `${window.location.origin}${window.location.pathname}?code=${encoded}`;
        navigator.clipboard.writeText(url);
        addLog('log', 'Shareable link copied to clipboard!');
    };

    return (
        <div className="h-16 px-6 border-b border-zinc-800 flex items-center justify-between bg-[#09090b]">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 mr-4">
                    <img src="/logo.png" alt="Web+ Logo" className="w-8 h-8 object-contain" />
                    <span className="font-bold text-lg text-white">Web+ <span className="text-zinc-500 font-normal ml-1">Playground</span></span>
                </div>

                <button
                    onClick={handleRun}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition-all shadow-lg shadow-blue-900/20"
                >
                    <Play size={16} fill="currentColor" />
                    <span>Run Code</span>
                </button>

                <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-md text-sm font-medium transition-all border border-zinc-800"
                >
                    <RotateCcw size={16} />
                    <span>Reset</span>
                </button>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={handleDownload}
                    className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-md transition-all border border-zinc-800"
                    title="Download .webplus"
                >
                    <Download size={18} />
                </button>
                <button
                    onClick={handleCopyLink}
                    className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-md transition-all border border-zinc-800"
                    title="Copy Share Link"
                >
                    <Copy size={18} />
                </button>
                <button
                    onClick={toggleTheme}
                    className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-md transition-all border border-zinc-800"
                >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
            </div>
        </div>
    );
};
