export * from './tokenizer';
export * from './parser';
export * from './transpiler';

import { Tokenizer } from './tokenizer';
import { Parser } from './parser';
import { Transpiler } from './transpiler';

export function compileWebPlus(source: string): string {
    const tokenizer = new Tokenizer(source);
    const tokens = tokenizer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const transpiler = new Transpiler();
    return transpiler.transpile(ast);
}
