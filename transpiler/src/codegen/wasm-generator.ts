// Web+ to WebAssembly Generator
// Direct WASM generation without Emscripten dependency

import {
    Program, Statement, Expression, NodeType,
    FunctionDeclaration, VariableDeclaration, BinaryExpression,
    CallExpression, ReturnStatement, IfStatement, WhileStatement,
    ForStatement, Identifier, Literal, MemberExpression,
    ExpressionStatement, BlockStatement, TypeAnnotation, PrimitiveType
} from '../ast';

export interface WasmGeneratorOptions {
    optimize?: boolean;
    debug?: boolean;
}

export class WasmGenerator {
    private locals: Map<string, number> = new Map();
    private localCount = 0;
    private strings: string[] = [];
    private stringMap: Map<string, number> = new Map();
    private indent = 0;

    generate(ast: Program, options: WasmGeneratorOptions = {}): string {
        const lines: string[] = [];

        // Header
        lines.push('(module');
        lines.push('  ;; Web+ Generated WebAssembly (Direct WASM)');
        lines.push('');

        // Memory section
        lines.push('  (memory 1) ;; 1 page (64KB)');
        lines.push('  (export "memory" (memory 0))');
        lines.push('');

        // Generate import for DOM operations
        lines.push(this.generateImports());

        // Generate functions
        for (const node of ast.body) {
            if (node.type === NodeType.FunctionDeclaration) {
                lines.push(this.generateFunction(node as FunctionDeclaration));
            } else if (node.type === NodeType.VariableDeclaration) {
                lines.push(this.generateGlobalVar(node as VariableDeclaration));
            }
        }

        // Export main
        lines.push(this.generateMainExport());

        lines.push(')');
        return lines.join('\n');
    }

    private generateImports(): string {
        return `  ;; Import object for DOM and runtime (no Emscripten needed)
  (import "env" "print" (func $print (param i32)))
  (import "env" "printStr" (func $printStr (param i32)))
  (import "env" "domGet" (func $domGet (param i32 i32) (result i32)))
  (import "env" "domSetText" (func $domSetText (param i32 i32)))
  (import "env" "domSetHtml" (func $domSetHtml (param i32 i32)))
  (import "env" "domCreateElement" (func $domCreateElement (param i32) (result i32)))
  (import "env" "domAppendChild" (func $domAppendChild (param i32 i32)))
  (import "env" "domRemove" (func $domRemove (param i32)))
  (import "env" "domSetStyle" (func $domSetStyle (param i32 i32 i32)))
  (import "env" "domOn" (func $domOn (param i32 i32 i32)))
  (import "env" "alloc" (func $alloc (param i32) (result i32)))
  (import "env" "free" (func $free (param i32)))
  (import "env" "rand" (func $rand (result i32)))
  (import "env" "sleep" (func $sleep (param i32)))
  (import "env" "fetch" (func $fetch (param i32 i32 i32)))
  (import "env" "workerSpawn" (func $workerSpawn (param i32) (result i32)))
`;
    }

    private generateGlobalVar(node: VariableDeclaration): string {
        const name = this.sanitizeName(node.name);
        const type = this.mapType(node.varType);

        let init = '0';
        if (node.initializer) {
            init = this.evalLiteral(node.initializer);
        }

        return `  (global $${name} (mut ${type}) (${init}))`;
    }

    private generateFunction(node: FunctionDeclaration): string {
        this.locals.clear();
        this.localCount = 0;

        const funcName = node.name === 'main' ? '_start' : this.sanitizeName(node.name);
        const params = node.parameters.map((p, i) => {
            const name = this.sanitizeName(p.name);
            this.locals.set(name, i);
            return `(param $${name} ${this.mapType(p.paramType)})`;
        }).join(' ');

        const results = node.returnType && node.returnType.baseType !== PrimitiveType.Void
            ? `(result ${this.mapType(node.returnType)})`
            : '';

        const locals = this.generateLocalVars(node.body.statements);
        const body = this.generateBody(node.body.statements);

        const lines: string[] = [`  (func $${funcName} ${params} ${results}`];

        if (locals) lines.push(locals);
        if (body) {
            for (const line of body) {
                lines.push('    ' + line);
            }
        }

        lines.push('  )');
        return lines.join('\n');
    }

    private generateLocalVars(statements: Statement[]): string | null {
        const vars: string[] = [];
        for (const stmt of statements) {
            if (stmt.type === NodeType.VariableDeclaration) {
                const decl = stmt as VariableDeclaration;
                if (!this.locals.has(decl.name)) {
                    this.locals.set(decl.name, this.localCount++);
                    vars.push(`(local $${this.sanitizeName(decl.name)} ${this.mapType(decl.varType)})`);
                }
            }
        }
        return vars.length > 0 ? '  (local ' + vars.join(' ') + ')' : null;
    }

    private generateBody(statements: Statement[]): string[] {
        const code: string[] = [];

        for (const stmt of statements) {
            const stmtCode = this.generateStatement(stmt);
            if (stmtCode) code.push(...stmtCode);
        }

        return code;
    }

    private generateStatement(stmt: Statement): string[] {
        switch (stmt.type) {
            case NodeType.ReturnStatement:
                return this.generateReturn(stmt as ReturnStatement);
            case NodeType.IfStatement:
                return this.generateIf(stmt as IfStatement);
            case NodeType.WhileStatement:
                return this.generateWhile(stmt as WhileStatement);
            case NodeType.ForStatement:
                return this.generateFor(stmt as ForStatement);
            case NodeType.ExpressionStatement:
                return this.generateExprStmt(stmt as ExpressionStatement);
            case NodeType.VariableDeclaration:
                return this.generateLocalVar(stmt as VariableDeclaration);
            default:
                return [];
        }
    }

    private generateReturn(stmt: ReturnStatement): string[] {
        if (stmt.argument) {
            const val = this.generateExpr(stmt.argument);
            return ['(return ' + val + ')'];
        }
        return ['(return)'];
    }

    private generateIf(stmt: IfStatement): string[] {
        const cond = this.generateExpr(stmt.condition);
        const then = this.generateStatementAsBody(stmt.consequent);

        let code: string[] = [];
        code.push(`(if (${cond})`);

        if (then.length > 0) {
            code.push('  (then');
            for (const line of then) {
                code.push('    ' + line);
            }
            code.push('  )');
        }

        if (stmt.alternate) {
            const elseBody = this.generateStatementAsBody(stmt.alternate);
            code.push('  (else');
            for (const line of elseBody) {
                code.push('    ' + line);
            }
            code.push('  )');
        }

        code.push(')');
        return code;
    }

    private generateStatementAsBody(stmt: Statement): string[] {
        if (stmt.type === NodeType.BlockStatement) {
            return this.generateBody((stmt as BlockStatement).statements);
        }
        return this.generateStatement(stmt);
    }

    private generateWhile(stmt: WhileStmt): string[] {
        const cond = this.generateExpr(stmt.condition);
        const body = this.generateStatementAsBody(stmt.body);

        let code: string[] = [];
        code.push(`(block`);
        code.push(`  (loop`);
        code.push(`    (br_if 1 (${this.negate(cond)}))`);

        for (const line of body) {
            code.push('    ' + line);
        }

        code.push(`    (br 0)`);
        code.push(`  )`);
        code.push(`)`);

        return code;
    }

    private generateFor(stmt: ForStatement): string[] {
        let code: string[] = [];

        if (stmt.initializer) {
            code.push(...this.generateStatement(stmt.initializer));
        }

        code.push(`(block`);
        code.push(`  (loop`);

        if (stmt.condition) {
            const cond = this.generateExpr(stmt.condition);
            code.push(`    (br_if 1 (${this.negate(cond)}))`);
        }

        if (stmt.body) {
            const body = this.generateStatementAsBody(stmt.body);
            for (const line of body) {
                code.push('    ' + line);
            }
        }

        if (stmt.increment) {
            code.push(...this.generateExprStmtFromExpr(stmt.increment));
        }

        code.push(`    (br 0)`);
        code.push(`  )`);
        code.push(`)`);

        return code;
    }

    private generateExprStmt(stmt: ExpressionStatement): string[] {
        const val = this.generateExpr(stmt.expression);
        return [val + ' (drop)'];
    }

    private generateExprStmtFromExpr(expr: Expression): string[] {
        const val = this.generateExpr(expr);
        return [val + ' (drop)'];
    }

    private generateLocalVar(stmt: VariableDeclaration): string[] {
        const name = this.sanitizeName(stmt.name);
        if (stmt.initializer) {
            const val = this.generateExpr(stmt.initializer);
            return [`(local.set $${name} ${val})`];
        }
        return [];
    }

    private generateExpr(expr: Expression): string {
        switch (expr.type) {
            case NodeType.Literal:
                return this.evalLiteral(expr as Literal);
            case NodeType.Identifier:
                const name = (expr as Identifier).name;
                const safeName = this.sanitizeName(name);
                if (this.locals.has(name)) {
                    return `(local.get $${safeName})`;
                }
                return `(global.get $${safeName})`;
            case NodeType.BinaryExpression:
                return this.generateBinary(expr as BinaryExpression);
            case NodeType.CallExpression:
                return this.generateCall(expr as CallExpression);
            case NodeType.MemberExpression:
                return this.generateMember(expr as MemberExpression);
            default:
                return '0';
        }
    }

    private generateBinary(expr: BinaryExpression): string {
        const left = this.generateExpr(expr.left);
        const right = this.generateExpr(expr.right);
        const op = this.mapOp(expr.operator);

        if (op) {
            return `(${op} ${left} ${right})`;
        }
        return left;
    }

    private generateCall(expr: CallExpression): string {
        let funcName = '';
        if (expr.callee.type === NodeType.Identifier) {
            funcName = (expr.callee as Identifier).name;
        }

        const args = expr.arguments.map(a => this.generateExpr(a)).join(' ') || '';
        const safeName = this.sanitizeName(funcName);

        // Map Web+ builtins to WASM imports
        if (funcName === 'print' || funcName === 'log' || funcName === 'warn' || funcName === 'error') {
            return `(call $print ${args})`;
        }
        if (funcName === 'dom__get' || funcName === 'dom_get' || funcName === 'dom::get') {
            return `(call $domGet ${args})`;
        }
        if (funcName === 'dom__createElement' || funcName === 'dom_createElement') {
            return `(call $domCreateElement ${args})`;
        }
        if (funcName === 'alloc') {
            return `(call $alloc ${args})`;
        }
        if (funcName === 'free') {
            return `(call $free ${args})`;
        }
        if (funcName === 'rand' || funcName === 'randomFloat' || funcName === 'randomDouble') {
            return `(call $rand)`;
        }
        if (funcName === 'sleep') {
            return `(call $sleep ${args})`;
        }
        if (funcName === 'sqrt' || funcName === 'sin' || funcName === 'cos' ||
            funcName === 'tan' || funcName === 'abs' || funcName === 'floor' ||
            funcName === 'ceil' || funcName === 'round') {
            return `(call $${safeName} ${args})`;
        }

        return `(call $${safeName} ${args})`;
    }

    private generateMember(expr: MemberExpression): string {
        // Handle element.style.property access
        // For now, return 0 as placeholder
        return '0';
    }

    private evalLiteral(expr: Expression): string {
        if (expr.type === NodeType.Literal) {
            const lit = expr as Literal;
            if (typeof lit.value === 'number') {
                return lit.value.toString();
            }
            if (typeof lit.value === 'string') {
                const idx = this.addString(lit.value);
                return idx.toString();
            }
            if (lit.value === true) return '1';
            if (lit.value === false) return '0';
        }
        return '0';
    }

    private addString(str: string): number {
        if (this.stringMap.has(str)) {
            return this.stringMap.get(str)!;
        }
        const idx = this.strings.length;
        this.stringMap.set(str, idx);
        this.strings.push(str);
        return idx;
    }

    private sanitizeName(name: string): string {
        return name.replace(/[^a-zA-Z0-9_]/g, '_');
    }

    private mapType(type: TypeAnnotation | undefined): string {
        if (!type) return 'i32';
        switch (type.baseType) {
            case PrimitiveType.Int:
            case PrimitiveType.Bool:
                return 'i32';
            case PrimitiveType.Float:
                return 'f32';
            case PrimitiveType.Double:
                return 'f64';
            case PrimitiveType.String:
                return 'i32'; // String is pointer
            default:
                return 'i32';
        }
    }

    private mapOp(op: string): string | null {
        switch (op) {
            case '+': return 'i32.add';
            case '-': return 'i32.sub';
            case '*': return 'i32.mul';
            case '/': return 'i32.div_s';
            case '%': return 'i32.rem_s';
            case '==': return 'i32.eq';
            case '!=': return 'i32.ne';
            case '<': return 'i32.lt_s';
            case '>': return 'i32.gt_s';
            case '<=': return 'i32.le_s';
            case '>=': return 'i32.ge_s';
            case '&&': return 'i32.and';
            case '||': return 'i32.or';
            default: return null;
        }
    }

    private negate(cond: string): string {
        return `(i32.eqz ${cond})`;
    }

    private generateMainExport(): string {
        return `
  ;; Export main function
  (export "_start" (func $_start))
  (export "main" (func $_start))
`;
    }
}

// Type alias for compatibility
interface WhileStmt extends WhileStatement {}

// Main entry point
export function transpileToWasm(source: string, options: WasmGeneratorOptions = {}): string {
    const { Parser } = require('../parser');
    const parser = new Parser(source);
    const ast = parser.parse();

    const generator = new WasmGenerator();
    return generator.generate(ast, options);
}