import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Log {
    type: 'log' | 'error' | 'warn';
    message: string;
    timestamp: string;
}

interface PlaygroundState {
    code: string;
    compiledCode: string;
    logs: Log[];
    theme: 'dark' | 'light';
    isCompiling: boolean;

    setCode: (code: string) => void;
    setCompiledCode: (code: string) => void;
    addLog: (type: 'log' | 'error' | 'warn', message: string) => void;
    clearLogs: () => void;
    toggleTheme: () => void;
    setCompiling: (isCompiling: boolean) => void;
}

export const usePlaygroundState = create<PlaygroundState>()(
    persist(
        (set) => ({
            code: `import webplus.dom

fn main() {
    dom.render("<h1>Hello from Web+</h1>")
}`,
            compiledCode: '',
            logs: [],
            theme: 'dark',
            isCompiling: false,

            setCode: (code) => set({ code }),
            setCompiledCode: (compiledCode) => set({ compiledCode }),
            addLog: (type, message) => set((state) => ({
                logs: [...state.logs, { type, message, timestamp: new Date().toLocaleTimeString() }].slice(-50)
            })),
            clearLogs: () => set({ logs: [] }),
            toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
            setCompiling: (isCompiling) => set({ isCompiling }),
        }),
        {
            name: 'webplus-playground',
            partialize: (state) => ({ code: state.code, theme: state.theme }),
        }
    )
);
