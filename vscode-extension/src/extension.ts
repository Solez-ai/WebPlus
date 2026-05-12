import * as vscode from 'vscode';
import * as path from 'path';
import { spawn } from 'child_process';

export function activate(context: vscode.ExtensionContext) {
    console.log('Web+ extension activated');

    const buildCommand = vscode.commands.registerCommand('webplus.build', async () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showErrorMessage('No active Web+ file');
            return;
        }

        const filePath = activeEditor.document.fileName;
        if (!filePath.endsWith('.webplus')) {
            vscode.window.showErrorMessage('Not a Web+ file')
            return;
        }

        const outputPath = path.join(path.dirname(filePath), 'build');

        vscode.window.showInformationMessage('Building Web+ project...');

        const process = spawn('webplus', ['build', filePath, '-o', outputPath]);

        process.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        process.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        process.on('close', (code) => {
            if (code === 0) {
                vscode.window.showInformationMessage('Build successful!');
            } else {
                vscode.window.showErrorMessage(`Build failed with code ${code}`);
            }
        });
    });

    const runCommand = vscode.commands.registerCommand('webplus.run', async (resource: vscode.Uri) => {
        let uri = resource;
        if (!uri) {
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                vscode.window.showErrorMessage('No active Web+ file');
                return;
            }
            uri = activeEditor.document.uri;
        }

        const filePath = uri.fsPath;
        // Use integrated terminal to run CLI
        // This gives improved visibility and persistence
        const terminal = vscode.window.activeTerminal || vscode.window.createTerminal('Web+');
        terminal.show();
        terminal.sendText(`webplus run "${filePath}"`);
    });

    const formatCommand = vscode.commands.registerCommand('webplus.format', async () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            return;
        }

        vscode.window.showInformationMessage('Formatting Web+ code...');
    });

    const diagnosticCollection = vscode.languages.createDiagnosticCollection('webplus');
    context.subscriptions.push(diagnosticCollection);

    vscode.workspace.onDidChangeTextDocument(event => {
        if (event.document.languageId === 'webplus') {
            validateDocument(event.document, diagnosticCollection);
        }
    });

    vscode.workspace.onDidOpenTextDocument(document => {
        if (document.languageId === 'webplus') {
            validateDocument(document, diagnosticCollection);
        }
    });

    const completionProvider = vscode.languages.registerCompletionItemProvider('webplus', {
        provideCompletionItems(document, position) {
            const completions: vscode.CompletionItem[] = [];

            const keywords = ['int', 'float', 'double', 'bool', 'char', 'string', 'void', 'struct', 'route', 'worker', 'if', 'else', 'while', 'for', 'return'];
            keywords.forEach(keyword => {
                const item = new vscode.CompletionItem(keyword, vscode.CompletionItemKind.Keyword);
                completions.push(item);
            });

            const webPrimitives = [
                { name: 'dom::get', detail: 'Get DOM element by selector' },
                { name: 'fetch', detail: 'Make HTTP request' },
                { name: 'worker::spawn', detail: 'Create web worker' },
                { name: 'alloc', detail: 'Allocate memory' },
                { name: 'free', detail: 'Free memory' },
                { name: 'json', detail: 'Create JSON response' }
            ];

            webPrimitives.forEach(prim => {
                const item = new vscode.CompletionItem(prim.name, vscode.CompletionItemKind.Function);
                item.detail = prim.detail;
                completions.push(item);
            });

            return completions;
        }
    });

    // CodeLens Provider to add "Run" button above main()
    const codeLensProvider = vscode.languages.registerCodeLensProvider('webplus', {
        provideCodeLenses(document, token) {
            const codeLenses: vscode.CodeLens[] = [];
            const text = document.getText();
            const mainPattern = /void\s+main\s*\(\s*\)/g;
            let match;

            while ((match = mainPattern.exec(text)) !== null) {
                const startPos = document.positionAt(match.index);
                const range = new vscode.Range(startPos, startPos);
                const cmd: vscode.Command = {
                    title: "$(play) Run Web+",
                    command: "webplus.run",
                    arguments: [document.uri]
                };
                codeLenses.push(new vscode.CodeLens(range, cmd));
            }
            return codeLenses;
        }
    });

    context.subscriptions.push(buildCommand, runCommand, formatCommand, completionProvider, codeLensProvider);
}

function validateDocument(document: vscode.TextDocument, diagnosticCollection: vscode.DiagnosticCollection) {
    const diagnostics: vscode.Diagnostic[] = [];
    const text = document.getText();

    const allocPattern = /alloc\s*<\s*\w+\s*>\s*\(/g;
    const freePattern = /free\s*\(/g;

    const allocMatches = text.match(allocPattern) || [];
    const freeMatches = text.match(freePattern) || [];

    if (allocMatches.length > freeMatches.length) {
        const diagnostic = new vscode.Diagnostic(
            new vscode.Range(0, 0, 0, 10),
            'Potential memory leak: More alloc() calls than free() calls',
            vscode.DiagnosticSeverity.Warning
        );
        diagnostics.push(diagnostic);
    }

    diagnosticCollection.set(document.uri, diagnostics);
}

export function deactivate() {
    console.log('Web+ extension deactivated');
}
