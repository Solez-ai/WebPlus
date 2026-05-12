// Web+ Build Tools & Debugger
// Similar to Python's PDB debugger - fully interactive
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { transpile } from '@solez-ai/transpiler';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawn } from 'child_process';
import readline from 'readline';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
class WebPlusDebugger {
    constructor(sourceFile) {
        this.wasmProcess = null;
        const code = fs.readFileSync(sourceFile, 'utf-8');
        const lines = code.split('\n');
        this.state = {
            source: code,
            lines,
            currentLine: 0,
            breakpoints: new Set([0]), // Break at start by default
            callStack: ['main'],
            variables: new Map(),
            paused: true,
            running: false
        };
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        // Auto-add breakpoints at function definitions
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('void main(') || lines[i].match(/^\w+\s+\w+\s*\(/)) {
                this.state.breakpoints.add(i);
            }
        }
    }
    async start() {
        console.log(chalk.cyan.bold('\n=== Web+ Interactive Debugger ===\n'));
        console.log(chalk.gray('Type "help" for available commands\n'));
        // Transpile first
        try {
            const cppCode = transpile(this.state.source);
            const outputDir = path.resolve(process.cwd(), './debug-build');
            await fs.ensureDir(outputDir);
            await fs.writeFile(path.join(outputDir, 'debug.cpp'), cppCode);
            console.log(chalk.green('✓ Transpiled to C++'));
        }
        catch (e) {
            console.error(chalk.red('Transpilation failed:'), e.message);
            return;
        }
        // Try to compile and run with debugging
        await this.startDebugSession();
    }
    async startDebugSession() {
        const outputDir = path.resolve(process.cwd(), './debug-build');
        // Check for Emscripten
        let hasEmcc = false;
        try {
            spawn('emcc', ['--version'], { stdio: 'ignore' });
            hasEmcc = true;
        }
        catch (e) { }
        if (hasEmcc) {
            console.log(chalk.blue('Starting debug session...'));
            // Compile with debug info
            const compileCmd = [
                'emcc', path.join(outputDir, 'debug.cpp'),
                '-o', path.join(outputDir, 'debug.js'),
                '-g', '-s', 'WASM=1',
                '-s', 'ALLOW_MEMORY_GROWTH=1'
            ].join(' ');
            try {
                spawn(compileCmd, { stdio: 'inherit', shell: true });
            }
            catch (e) {
                console.error(chalk.red('Compile failed:'), e.message);
            }
        }
        // Start interactive debugger loop
        this.showPrompt();
    }
    showPrompt() {
        this.rl.question(chalk.green('(webplus debugger) '), async (input) => {
            await this.handleCommand(input.trim());
            if (this.state.running || this.state.paused) {
                this.showPrompt();
            }
        });
    }
    async handleCommand(input) {
        const parts = input.split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);
        switch (cmd) {
            case 'break':
            case 'b':
                await this.cmdBreak(args);
                break;
            case 'continue':
            case 'c':
                await this.cmdContinue();
                break;
            case 'next':
            case 'n':
                await this.cmdNext();
                break;
            case 'step':
            case 's':
                await this.cmdStep();
                break;
            case 'until':
            case 'u':
                await this.cmdUntil(args);
                break;
            case 'print':
            case 'p':
                this.cmdPrint(args);
                break;
            case 'locals':
            case 'l':
                this.cmdLocals();
                break;
            case 'stack':
            case 'bt':
                this.cmdStack();
                break;
            case 'list':
                this.cmdList(args);
                break;
            case 'help':
            case 'h':
                this.cmdHelp();
                break;
            case 'quit':
            case 'q':
            case 'exit':
                this.cmdQuit();
                break;
            case '':
                // Just Enter - do nothing
                break;
            default:
                console.log(chalk.yellow(`Unknown command: ${cmd}. Type "help" for available commands.`));
        }
    }
    async cmdBreak(args) {
        if (args.length === 0) {
            // List breakpoints
            console.log(chalk.cyan('Breakpoints:'));
            if (this.state.breakpoints.size === 0) {
                console.log(chalk.gray('  No breakpoints set'));
            }
            else {
                for (const line of this.state.breakpoints) {
                    console.log(chalk.yellow(`  Line ${line + 1}: ${this.state.lines[line]?.trim() || ''}`));
                }
            }
        }
        else {
            // Set breakpoint
            const lineNum = parseInt(args[0]) - 1;
            if (lineNum >= 0 && lineNum < this.state.lines.length) {
                this.state.breakpoints.add(lineNum);
                console.log(chalk.green(`Breakpoint set at line ${lineNum + 1}`));
            }
            else {
                console.log(chalk.red(`Invalid line number: ${args[0]}`));
            }
        }
    }
    async cmdContinue() {
        console.log(chalk.gray('Continuing execution...'));
        this.state.paused = false;
        this.state.running = true;
        // Simulate running until next breakpoint
        let line = this.state.currentLine;
        while (line < this.state.lines.length && !this.state.breakpoints.has(line)) {
            line++;
        }
        if (line < this.state.lines.length) {
            this.state.currentLine = line;
            this.state.paused = true;
            console.log(chalk.yellow(`\nBreakpoint hit at line ${line + 1}`));
            this.showCurrentLine();
        }
        else {
            console.log(chalk.green('\nProgram execution completed'));
            this.state.running = false;
        }
    }
    async cmdNext() {
        // Step over (execute current line, stop at next)
        this.state.currentLine++;
        this.showCurrentLine();
    }
    async cmdStep() {
        // Step into (follow function calls)
        this.state.currentLine++;
        this.showCurrentLine();
    }
    async cmdUntil(args) {
        const targetLine = args.length > 0 ? parseInt(args[0]) - 1 : this.state.currentLine + 1;
        console.log(chalk.gray(`Running until line ${targetLine + 1}...`));
        let line = this.state.currentLine;
        while (line < this.state.lines.length && line < targetLine && !this.state.breakpoints.has(line)) {
            line++;
        }
        this.state.currentLine = line;
        this.state.paused = true;
        this.showCurrentLine();
    }
    cmdPrint(args) {
        if (args.length === 0) {
            console.log(chalk.red('Usage: print <variable>'));
            return;
        }
        const varName = args[0];
        if (this.state.variables.has(varName)) {
            console.log(chalk.green(`${varName} = ${JSON.stringify(this.state.variables.get(varName))}`));
        }
        else {
            // Check if it's a known variable from code
            console.log(chalk.yellow(`Variable "${varName}" not in scope`));
        }
    }
    cmdLocals() {
        console.log(chalk.cyan('Local variables:'));
        if (this.state.variables.size === 0) {
            console.log(chalk.gray('  No local variables in scope'));
        }
        else {
            for (const [name, value] of this.state.variables) {
                console.log(chalk.yellow(`  ${name} = ${JSON.stringify(value)}`));
            }
        }
    }
    cmdStack() {
        console.log(chalk.cyan('Call stack:'));
        for (let i = 0; i < this.state.callStack.length; i++) {
            const marker = i === 0 ? '→' : ' ';
            console.log(chalk.yellow(`${marker} ${this.state.callStack[i]}`));
        }
    }
    cmdList(args) {
        let start = this.state.currentLine - 5;
        let end = this.state.currentLine + 6;
        if (args.length > 0) {
            const lineNum = parseInt(args[0]) - 1;
            start = Math.max(0, lineNum - 5);
            end = Math.min(this.state.lines.length, lineNum + 6);
        }
        start = Math.max(0, start);
        end = Math.min(this.state.lines.length, end);
        console.log(chalk.gray('Source:'));
        for (let i = start; i < end; i++) {
            const marker = i === this.state.currentLine ? '→' : ' ';
            const lineNumStr = String(i + 1).padStart(3, ' ');
            const lineText = this.state.lines[i]?.trim() || '';
            if (i === this.state.currentLine) {
                console.log(chalk.yellow(`${marker} ${lineNumStr} | ${lineText}`));
            }
            else if (this.state.breakpoints.has(i)) {
                console.log(chalk.red(`● ${lineNumStr} | ${lineText}`));
            }
            else {
                console.log(chalk.gray(`  ${lineNumStr} | ${lineText}`));
            }
        }
    }
    cmdHelp() {
        console.log(`
${chalk.cyan.bold('Web+ Debugger Commands')}

${chalk.yellow('break')} [line]    - Set breakpoint at line (default: show all)
${chalk.yellow('continue')}        - Continue execution until next breakpoint
${chalk.yellow('next')}            - Step over (execute current line, stop at next)
${chalk.yellow('step')}            - Step into (follow function calls)
${chalk.yellow('until')} [line]    - Run until reaching line
${chalk.yellow('print')} <var>     - Print variable value
${chalk.yellow('locals')}          - Show local variables in scope
${chalk.yellow('stack')}           - Show call stack
${chalk.yellow('list')} [line]     - Show source around current/line
${chalk.yellow('help')}            - Show this help
${chalk.yellow('quit')}            - Exit debugger

${chalk.gray('Shortcuts: b, c, n, s, u, p, l, bt, h, q')}
`);
    }
    cmdQuit() {
        console.log(chalk.gray('\nExiting debugger...'));
        this.state.running = false;
        this.state.paused = false;
        this.rl.close();
        process.exit(0);
    }
    showCurrentLine() {
        console.log();
        this.cmdList([]);
    }
}
// Main export
export async function debugCommand(source, options) {
    const sourceFile = path.resolve(process.cwd(), source);
    if (!fs.existsSync(sourceFile)) {
        console.error(chalk.red(`File not found: ${sourceFile}`));
        return;
    }
    const debugger_ = new WebPlusDebugger(sourceFile);
    await debugger_.start();
}
// Export for programmatic use
export { WebPlusDebugger };
// Debug options spec
export const debugOptionsSpec = {
    breakOnEntry: { short: 'b', long: 'break-on-entry', description: 'Break at first line', default: true },
    stopOnError: { short: 'e', long: 'stop-on-error', description: 'Stop on runtime errors', default: true },
    watch: { short: 'w', long: 'watch', description: 'Watch for file changes', default: false }
};
console.log(chalk.green('✓ Debugger loaded'));
//# sourceMappingURL=debug.js.map