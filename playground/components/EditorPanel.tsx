'use client';

import Editor, { loader } from '@monaco-editor/react';
import { usePlaygroundState } from '@/hooks/usePlaygroundState';
import { useEffect } from 'react';

// Define Web+ language for Monaco
const setupWebPlus = (monaco: any) => {
    monaco.languages.register({ id: 'webplus' });

    monaco.languages.setMonarchTokensProvider('webplus', {
        tokenizer: {
            root: [
                [/[a-z_$][\w$]*/, {
                    cases: {
                        'import|fn|void|int|float|string|bool|dom|webplus|route|worker|return|namespace': 'keyword',
                        '@default': 'identifier'
                    }
                }],
                [/[{}()\[\]]/, '@brackets'],
                [/[<>!=\-+\/*%&|]+/, 'operator'],
                [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
                [/0[xX][0-9a-fA-F]+/, 'number.hex'],
                [/\d+/, 'number'],
                [/[;,.]/, 'delimiter'],
                [/"([^"\\]|\\.)*"/, 'string'],
                [/\/\/.*$/, 'comment'],
            ]
        }
    });

    monaco.languages.setLanguageConfiguration('webplus', {
        brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')']
        ],
        autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' }
        ],
        surroundingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' }
        ]
    });
};

export const EditorPanel = () => {
    const { code, setCode, theme } = usePlaygroundState();

    const handleEditorWillMount = (monaco: any) => {
        setupWebPlus(monaco);
    };

    const handleEditorChange = (value: string | undefined) => {
        if (value !== undefined) {
            setCode(value);
        }
    };

    return (
        <div className="h-full w-4/10 min-w-[400px] border-r border-zinc-800 bg-[#1e1e1e] flex flex-col">
            <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400 font-mono">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>main.webplus</span>
                </div>
            </div>
            <div className="flex-1 overflow-hidden">
                <Editor
                    height="100%"
                    language="webplus"
                    value={code}
                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                    beforeMount={handleEditorWillMount}
                    onChange={handleEditorChange}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        fontFamily: 'var(--font-mono)',
                        lineNumbers: 'on',
                        roundedSelection: true,
                        scrollBeyondLastLine: false,
                        readOnly: false,
                        automaticLayout: true,
                        padding: { top: 16, bottom: 16 },
                        glyphMargin: false,
                        folding: true,
                        lineDecorationsWidth: 10,
                        lineNumbersMinChars: 3
                    }}
                />
            </div>
        </div>
    );
};
