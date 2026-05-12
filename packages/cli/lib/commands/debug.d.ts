declare class WebPlusDebugger {
    private state;
    private rl;
    private wasmProcess;
    constructor(sourceFile: string);
    start(): Promise<void>;
    private startDebugSession;
    private showPrompt;
    private handleCommand;
    private cmdBreak;
    private cmdContinue;
    private cmdNext;
    private cmdStep;
    private cmdUntil;
    private cmdPrint;
    private cmdLocals;
    private cmdStack;
    private cmdList;
    private cmdHelp;
    private cmdQuit;
    private showCurrentLine;
}
export declare function debugCommand(source: string, options: any): Promise<void>;
export { WebPlusDebugger };
export declare const debugOptionsSpec: {
    breakOnEntry: {
        short: string;
        long: string;
        description: string;
        default: boolean;
    };
    stopOnError: {
        short: string;
        long: string;
        description: string;
        default: boolean;
    };
    watch: {
        short: string;
        long: string;
        description: string;
        default: boolean;
    };
};
//# sourceMappingURL=debug.d.ts.map