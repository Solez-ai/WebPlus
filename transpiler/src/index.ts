export { Parser } from './parser';
export { CppGenerator } from './codegen/cpp-generator';
export { WasmGenerator, transpileToWasm } from './codegen/wasm-generator';
export { Optimizer, optimizeAST } from './optimizer';
export * from './ast';

import { Parser } from './parser';
import { CppGenerator } from './codegen/cpp-generator';
import { WasmGenerator } from './codegen/wasm-generator';
import { Optimizer } from './optimizer';

export type OutputFormat = 'cpp' | 'wasm' | 'wat';

export interface TranspileOptions {
    output?: OutputFormat;
    optimize?: boolean;
    debug?: boolean;
    optimizationOptions?: {
        constantFolding?: boolean;
        deadCodeElimination?: boolean;
        inlineLiterals?: boolean;
    };
}

export function transpile(source: string, options: TranspileOptions = {}): string {
    const parser = new Parser(source);
    let ast = parser.parse();

    // Run optimizations if enabled
    if (options.optimize) {
        const optimizer = new Optimizer(options.optimizationOptions);
        ast = optimizer.optimize(ast);
    }

    const format = options.output || 'cpp';

    if (format === 'wasm' || format === 'wat') {
        const generator = new WasmGenerator();
        return generator.generate(ast, options);
    }

    // Default to C++
    const generator = new CppGenerator();
    const cppCode = generator.generate(ast);

    return cppCode;
}
