// Optimized Web+ Parser - Memory efficient for 5000+ lines
// Uses iterative parsing with depth tracking and memory limits

import { Program, Statement, Expression, NodeType, PrimitiveType, HttpMethod, TypeAnnotation, Parameter, BlockStatement, FunctionDeclaration, StructDeclaration, VariableDeclaration, ReturnStatement, IfStatement, ForStatement, WhileStatement, ExpressionStatement, BinaryExpression, CallExpression, UnaryExpression, MemberExpression, Identifier, Literal, LambdaExpression, AllocExpression, StackExpression, ArenaExpression, FreeExpression, DomGetExpression, FetchExpression, WorkerSpawnExpression } from './ast';

interface ParseContext {
    source: string;
    pos: number;
    line: number;
    col: number;
}

interface ParseOptions {
    maxDepth?: number;
    maxStatements?: number;
}

// Use iterative approach with depth tracking
export class Parser {
    private ctx: ParseContext;
    private body: Statement[] = [];
    private depth: number = 0;
    private maxDepth: number = 100;
    private statementCount: number = 0;
    private maxStatements: number = 50000;

    constructor(source: string, options: ParseOptions = {}) {
        this.ctx = { source, pos: 0, line: 1, col: 0 };
        this.maxDepth = options.maxDepth || 100;
        this.maxStatements = options.maxStatements || 50000;
    }

    parse(): Program {
        this.body = [];
        this.statementCount = 0;
        this.depth = 0;
        this.skipWhitespace();

        // Iteratively parse each statement until end
        while (!this.isAtEnd() && this.statementCount < this.maxStatements) {
            try {
                const stmt = this.parseStatement();
                if (stmt) {
                    this.body.push(stmt);
                    this.statementCount++;
                }
                this.skipWhitespace();
            } catch (e) {
                // On error, skip to next statement
                this.skipToNextStatement();
                this.skipWhitespace();
            }
        }

        return { type: NodeType.Program, body: this.body };
    }

    private checkDepth(): void {
        this.depth++;
        if (this.depth > this.maxDepth) {
            throw new Error(`Parse depth exceeded (max: ${this.maxDepth}). Possible recursive structure.`);
        }
    }

    private resetDepth(): void {
        this.depth = Math.max(0, this.depth - 1);
    }

    private skipToNextStatement(): void {
        // Find next semicolon or opening brace
        let braceCount = 0;
        while (!this.isAtEnd()) {
            const c = this.peek();
            if (c === '{') braceCount++;
            else if (c === '}') {
                if (braceCount <= 0) break;
                braceCount--;
            }
            else if (c === ';' && braceCount === 0) {
                this.advance();
                break;
            }
            this.advance();
        }
    }

    private parseStatement(): Statement {
        const word = this.peekWord();

        if (word === 'struct') return this.parseStructDeclaration();
        if (word === 'route') return this.parseRouteDeclaration();
        if (word === 'fn') return this.parseFnDeclaration();

        if (this.isTypeKeyword(word) || this.looksLikeType()) {
            return this.parseFunctionOrVariableDeclaration();
        }

        // Expression statement
        const expr = this.parseExpression();
        this.consume(';');
        return { type: NodeType.ExpressionStatement, expression: expr };
    }

    private looksLikeType(): boolean {
        const word = this.peekWord();
        // 'dom' is a namespace, not a type - don't include in type keywords
        if (this.isTypeKeyword(word)) return true;

        let pos = this.ctx.pos;
        // Skip identifier
        while (pos < this.ctx.source.length && (this.isAlpha(this.ctx.source[pos]) || this.isDigit(this.ctx.source[pos]))) pos++;
        // Skip whitespace
        while (pos < this.ctx.source.length && (this.ctx.source[pos] === ' ' || this.ctx.source[pos] === '\t')) pos++;

        // Check for namespace::Type pattern - only if what follows :: starts with uppercase (type) not lowercase (function)
        if (pos + 2 < this.ctx.source.length && this.ctx.source[pos] === ':' && this.ctx.source[pos + 1] === ':') {
            let afterColon = pos + 2;
            // Skip whitespace after ::
            while (afterColon < this.ctx.source.length && (this.ctx.source[afterColon] === ' ' || this.ctx.source[afterColon] === '\t')) afterColon++;
            // If next char after :: is uppercase, it's likely a type name
            if (afterColon < this.ctx.source.length && this.isUpperCase(this.ctx.source[afterColon])) {
                return true;
            }
        }

        if (pos + 1 < this.ctx.source.length) {
            if (this.ctx.source[pos] === '*' || this.ctx.source[pos] === '&') return true;
        }
        return false;
    }

    private parseFnDeclaration(): Statement {
        this.consume('fn');
        this.skipWhitespace();
        const name = this.consumeIdentifier();
        this.skipWhitespace();
        let returnType: TypeAnnotation = { baseType: PrimitiveType.Void, isPointer: false, isReference: false };
        return this.parseFunctionDeclaration(name, returnType);
    }

    private parseStructDeclaration(): Statement {
        this.consume('struct');
        this.skipWhitespace();
        const name = this.consumeIdentifier();
        this.skipWhitespace();
        this.consume('{');
        const fields: Array<{ name: string; fieldType: TypeAnnotation }> = [];
        this.skipWhitespace();

        while (!this.check('}') && !this.isAtEnd()) {
            const fieldType = this.parseType();
            this.skipWhitespace();
            const fieldName = this.consumeIdentifier();
            this.skipWhitespace();
            this.consume(';');
            fields.push({ name: fieldName, fieldType });
            this.skipWhitespace();
        }

        this.consume('}');
        this.skipWhitespace();
        if (this.check(';')) this.consume(';');
        return { type: NodeType.StructDeclaration, name, fields };
    }

    private parseRouteDeclaration(): Statement {
        this.consume('route');
        this.skipWhitespace();
        const methodStr = this.consumeWord();
        const method = HttpMethod[methodStr as keyof typeof HttpMethod] || HttpMethod.GET;
        this.skipWhitespace();
        const path = this.consumeStringLiteral();
        this.skipWhitespace();
        let returnType: TypeAnnotation = { baseType: 'Response', isPointer: false, isReference: false };
        if (this.check('->')) {
            this.consume('-'); this.consume('>');
            this.skipWhitespace();
            returnType = this.parseType();
            this.skipWhitespace();
        }
        const body = this.parseBlockStatement();
        return { type: NodeType.RouteDeclaration, method, path, returnType, body };
    }

    private parseFunctionOrVariableDeclaration(): Statement {
        const type = this.parseType();
        this.skipWhitespace();
        const name = this.consumeIdentifier();
        this.skipWhitespace();
        if (this.check('(')) return this.parseFunctionDeclaration(name, type);
        return this.parseVariableDeclaration(name, type);
    }

    private parseFunctionDeclaration(name: string, returnType: TypeAnnotation): Statement {
        this.consume('(');
        const parameters: Parameter[] = [];
        this.skipWhitespace();

        while (!this.check(')') && !this.isAtEnd()) {
            const paramType = this.parseType();
            this.skipWhitespace();
            const paramName = this.consumeIdentifier();
            parameters.push({ name: paramName, paramType });
            this.skipWhitespace();
            if (this.check(',')) this.consume(',');
            this.skipWhitespace();
        }

        this.consume(')');
        this.skipWhitespace();
        const body = this.parseBlockStatement();
        return { type: NodeType.FunctionDeclaration, name, returnType, parameters, body };
    }

    private parseVariableDeclaration(name: string, varType: TypeAnnotation): Statement {
        let initializer: Expression | null = null;
        this.skipWhitespace();
        if (this.check('[')) { this.consume('['); while (this.peek() !== ']' && !this.isAtEnd()) this.advance(); this.consume(']'); }
        this.skipWhitespace();
        if (this.check('=')) { this.consume('='); this.skipWhitespace(); initializer = this.parseExpression(); }
        this.skipWhitespace();
        this.consume(';');
        return { type: NodeType.VariableDeclaration, varType, name, initializer };
    }

    private parseBlockStatement(): BlockStatement {
        this.checkDepth();
        this.consume('{');
        const statements: Statement[] = [];
        this.skipWhitespace();

        while (!this.check('}') && !this.isAtEnd()) {
            const word = this.peekWord();
            if (word === 'return') { statements.push(this.parseReturnStatement()); }
            else if (word === 'if') { statements.push(this.parseIfStatement()); }
            else if (word === 'for') { statements.push(this.parseForStatement()); }
            else if (word === 'while') { statements.push(this.parseWhileStatement()); }
            else if (this.isTypeKeyword(word) || this.looksLikeType()) { statements.push(this.parseFunctionOrVariableDeclaration()); }
            else { const expr = this.parseExpression(); this.consume(';'); statements.push({ type: NodeType.ExpressionStatement, expression: expr }); }
            this.skipWhitespace();
        }

        this.consume('}');
        this.resetDepth();
        return { type: NodeType.BlockStatement, statements };
    }

    private parseReturnStatement(): ReturnStatement {
        this.consume('return');
        this.skipWhitespace();
        let argument: Expression | null = null;
        if (!this.check(';')) argument = this.parseExpression();
        this.skipWhitespace();
        this.consume(';');
        return { type: NodeType.ReturnStatement, argument };
    }

    private parseIfStatement(): IfStatement {
        this.consume('if');
        this.skipWhitespace();
        this.consume('(');
        const condition = this.parseExpression();
        this.consume(')');
        this.skipWhitespace();
        const consequent = this.parseBlockStatement();
        let alternate: Statement | null = null;
        this.skipWhitespace();
        if (this.peekWord() === 'else') {
            this.consume('else');
            this.skipWhitespace();
            if (this.peekWord() === 'if') alternate = this.parseIfStatement();
            else alternate = this.parseBlockStatement();
        }
        return { type: NodeType.IfStatement, condition, consequent, alternate };
    }

    private parseForStatement(): ForStatement {
        this.consume('for');
        this.skipWhitespace();
        this.consume('(');
        this.skipWhitespace();
        let initializer: Statement | null = null;
        if (!this.check(';')) {
            if (this.isTypeKeyword(this.peekWord()) || this.looksLikeType()) {
                initializer = this.parseFunctionOrVariableDeclaration();
            } else {
                const expr = this.parseExpression();
                this.consume(';');
                initializer = { type: NodeType.ExpressionStatement, expression: expr };
            }
        } else { this.consume(';'); this.skipWhitespace(); }
        let condition: Expression | null = null;
        if (!this.check(';')) condition = this.parseExpression();
        this.consume(';');
        this.skipWhitespace();
        let increment: Expression | null = null;
        if (!this.check(')')) increment = this.parseExpression();
        this.consume(')');
        this.skipWhitespace();
        const body = this.parseBlockStatement();
        return { type: NodeType.ForStatement, initializer, condition, increment, body };
    }

    private parseWhileStatement(): WhileStatement {
        this.consume('while');
        this.skipWhitespace();
        this.consume('(');
        const condition = this.parseExpression();
        this.consume(')');
        this.skipWhitespace();
        const body = this.parseBlockStatement();
        return { type: NodeType.WhileStatement, condition, body };
    }

    private parseExpression(): Expression { return this.parseAssignmentExpression(); }

    private parseAssignmentExpression(): Expression {
        let left = this.parseBinaryExpression();
        this.skipWhitespace();

        // Compound operators: += -= *= /= %= &= |=
        const current = this.peek();
        if (['+', '-', '*', '/', '%', '&', '|'].includes(current)) {
            this.advance();
            if (this.peek() === '=') {
                const op = current + '=';
                this.advance();
                this.skipWhitespace();
                const right = this.parseAssignmentExpression();
                return { type: NodeType.BinaryExpression, operator: op, left, right };
            }
            this.ctx.pos--; // Put back
        }

        // Simple assignment
        if (this.check('=') && this.peekNext() !== '=') {
            this.consume('=');
            this.skipWhitespace();
            const right = this.parseAssignmentExpression();
            return { type: NodeType.BinaryExpression, operator: '=', left, right };
        }
        return left;
    }

    private parseBinaryExpression(): Expression {
        let left = this.parsePrimaryExpression();
        this.skipWhitespace();

        while (this.isBinaryOperator(this.peek()) && this.peekNext() !== '=') {
            let operator = this.advance();
            if (operator === '=' && this.peek() === '=') { this.advance(); operator = '=='; }
            else if (operator === '!' && this.peek() === '=') { this.advance(); operator = '!='; }
            else if (operator === '<' && this.peek() === '=') { this.advance(); operator = '<='; }
            else if (operator === '>' && this.peek() === '=') { this.advance(); operator = '>='; }
            else if (operator === '&' && this.peek() === '&') { this.advance(); operator = '&&'; }
            else if (operator === '|' && this.peek() === '|') { this.advance(); operator = '||'; }
            this.skipWhitespace();
            const right = this.parsePrimaryExpression();
            left = { type: NodeType.BinaryExpression, operator, left, right };
            this.skipWhitespace();
        }
        return left;
    }

    private parsePrimaryExpression(): Expression {
        this.skipWhitespace();
        if (['!', '-', '++', '--', '&', '*'].includes(this.peek()) && !['worker', 'dom'].includes(this.peekWord())) {
            const operator = this.advance();
            if (operator === '+' && this.peek() === '+') { this.advance(); return { type: NodeType.UnaryExpression, operator: '++', target: this.parsePrimaryExpression(), isPostfix: false }; }
            if (operator === '-' && this.peek() === '-') { this.advance(); return { type: NodeType.UnaryExpression, operator: '--', target: this.parsePrimaryExpression(), isPostfix: false }; }
            return { type: NodeType.UnaryExpression, operator, target: this.parsePrimaryExpression(), isPostfix: false };
        }
        if (this.check('[')) return this.parseLambdaExpression();
        const word = this.peekWord();
        if (word === 'alloc') return this.parseAllocExpression();
        if (word === 'stack') return this.parseStackExpression();
        if (word === 'arena') return this.parseArenaExpression();
        if (word === 'free') return this.parseFreeExpression();
        if (word === 'dom') return this.parseDomExpression();
        if (word === 'fetch') return this.parseFetchExpression();
        if (word === 'worker') return this.parseWorkerExpression();
        if (this.peek() === '"' || this.peek() === "'") return this.parseStringLiteral();
        if (this.isDigit(this.peek())) return this.parseNumberLiteral();
        if (word === 'true' || word === 'false') return this.parseBooleanLiteral();

        let expr: Expression = { type: NodeType.Identifier, name: this.consumeIdentifier() };
        this.skipWhitespace();
        while (this.check('(') || this.check('.') || this.check('->') || this.check('<')) {
            if (this.check('(') || this.check('<')) expr = this.parseCallExpression(expr);
            else if (this.check('.') || this.check('->')) { const isPtr = this.check('->'); this.advance(); if (isPtr) this.advance(); this.skipWhitespace(); const prop = this.consumeIdentifier(); expr = { type: NodeType.MemberExpression, object: expr, property: prop, isPointer: isPtr }; }
            this.skipWhitespace();
        }
        return expr;
    }

    private parseLambdaExpression(): Expression {
        this.consume('[');
        let captures = '';
        while (this.peek() !== ']' && !this.isAtEnd()) captures += this.advance();
        this.consume(']');
        let parameters: Parameter[] = [];
        this.skipWhitespace();
        if (this.check('(')) {
            this.consume('(');
            this.skipWhitespace();
            while (!this.check(')') && !this.isAtEnd()) {
                const pType = this.parseType();
                this.skipWhitespace();
                const pName = this.consumeIdentifier();
                parameters.push({ name: pName, paramType: pType });
                this.skipWhitespace();
                if (this.check(',')) this.consume(',');
                this.skipWhitespace();
            }
            this.consume(')');
        }
        const body = this.parseBlockStatement();
        return { type: NodeType.LambdaExpression, captures, parameters, body };
    }

    private parseAllocExpression(): Expression { this.consume('alloc'); this.consume('<'); const type = this.parseType(); this.consume('>'); this.consume('('); const size = this.parseExpression(); this.consume(')'); return { type: NodeType.AllocExpression, allocType: type, size }; }
    private parseStackExpression(): Expression { this.consume('stack'); this.consume('<'); const type = this.parseType(); this.consume('>'); this.consume('('); const size = this.parseExpression(); this.consume(')'); return { type: NodeType.StackExpression, allocType: type, size }; }
    private parseArenaExpression(): Expression { this.consume('arena'); this.consume('<'); const type = this.parseType(); this.consume('>'); this.consume('('); const size = this.parseExpression(); this.consume(')'); return { type: NodeType.ArenaExpression, allocType: type, size }; }
    private parseFreeExpression(): Expression { this.consume('free'); this.consume('('); const pointer = this.parseExpression(); this.consume(')'); return { type: NodeType.FreeExpression, pointer }; }
    private parseDomExpression(): Expression { this.consume('dom'); this.consume(':'); this.consume(':'); this.consume('get'); this.consume('('); const selector = this.parseExpression(); this.consume(')'); return { type: NodeType.DomGetExpression, selector }; }
    private parseFetchExpression(): Expression { this.consume('fetch'); this.consume('('); const url = this.parseExpression(); this.consume(')'); return { type: NodeType.FetchExpression, url }; }
    private parseWorkerExpression(): Expression { this.consume('worker'); this.consume(':'); this.consume(':'); this.consume('spawn'); this.consume('('); const callback = this.parseExpression(); this.consume(')'); return { type: NodeType.WorkerSpawnExpression, callback }; }

    private parseCallExpression(callee: Expression): Expression {
        let templateArgs: TypeAnnotation[] = [];
        if (this.check('<')) { this.consume('<'); while (!this.check('>') && !this.isAtEnd()) { templateArgs.push(this.parseType()); if (this.check(',')) this.consume(','); } this.consume('>'); }
        if (this.check('(')) {
            this.consume('('); const args: Expression[] = [];
            while (!this.check(')') && !this.isAtEnd()) { args.push(this.parseExpression()); if (this.check(',')) this.consume(','); }
            this.consume(')');
            return { type: NodeType.CallExpression, callee, arguments: args, templateArgs };
        }
        return callee;
    }

    private parseType(): TypeAnnotation {
        let baseType = this.consumeWord();
        while (this.check('::') || this.check('.')) { this.consume(':'); this.consume(':'); baseType += '::'; this.consumeWord(); }
        let ptr = false, ref = false;
        this.skipWhitespace();
        if (this.check('*')) { ptr = true; this.advance(); }
        else if (this.check('&')) { ref = true; this.advance(); }
        return { baseType: baseType as PrimitiveType, isPointer: ptr, isReference: ref };
    }

    private parseStringLiteral(): Expression { const q = this.advance(); let v = ''; while (this.peek() !== q && !this.isAtEnd()) v += this.advance(); this.consume(q); return { type: NodeType.Literal, value: v, literalType: PrimitiveType.String }; }
    private parseNumberLiteral(): Expression { let v = '', f = false; while (this.isDigit(this.peek()) || this.peek() === '.') { if (this.peek() === '.') f = true; v += this.advance(); } return { type: NodeType.Literal, value: f ? parseFloat(v) : parseInt(v), literalType: f ? PrimitiveType.Float : PrimitiveType.Int }; }
    private parseBooleanLiteral(): Expression { return { type: NodeType.Literal, value: this.consumeWord() === 'true', literalType: PrimitiveType.Bool }; }

    private isTypeKeyword(w: string): boolean { return ['int', 'float', 'double', 'bool', 'char', 'string', 'void', 'auto'].includes(w) || this.isUpperCase(w[0]); }
    private isBinaryOperator(c: string): boolean { return ['+', '-', '*', '/', '=', '<', '>', '!', '&', '|'].includes(c); }
    private isDigit(c: string): boolean { return c >= '0' && c <= '9'; }
    private isAlpha(c: string): boolean { return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_'; }
    private isUpperCase(c: string): boolean { return c >= 'A' && c <= 'Z'; }

    private skipWhitespace(): void {
        while (!this.isAtEnd()) {
            const c = this.peek();
            if ([' ', '\t', '\r'].includes(c)) this.advance();
            else if (c === '\n') { this.ctx.line++; this.ctx.col = 0; this.advance(); }
            else if (c === '/' && this.peekNext() === '/') { while (this.peek() !== '\n' && !this.isAtEnd()) this.advance(); }
            else if (c === '/' && this.peekNext() === '*') { this.advance(); this.advance(); while (!(this.peek() === '*' && this.peekNext() === '/') && !this.isAtEnd()) { if (this.peek() === '\n') { this.ctx.line++; this.ctx.col = 0; } this.advance(); } this.advance(); this.advance(); }
            else break;
        }
    }

    private peek(): string { return this.isAtEnd() ? '\0' : this.ctx.source[this.ctx.pos]; }
    private peekNext(): string { return this.ctx.pos + 1 >= this.ctx.source.length ? '\0' : this.ctx.source[this.ctx.pos + 1]; }
    private peekWord(): string { let w = '', p = this.ctx.pos; while (p < this.ctx.source.length && (this.isAlpha(this.ctx.source[p]) || this.isDigit(this.ctx.source[p]))) w += this.ctx.source[p++]; return w; }
    private advance(): string { this.ctx.col++; return this.ctx.source[this.ctx.pos++]; }
    private consume(e: string): void { for (let i = 0; i < e.length; i++) { if (this.peek() !== e[i]) throw new Error(`Expected '${e}' but got '${this.peek()}' at line ${this.ctx.line}`); this.advance(); } }
    private consumeWord(): string { let w = ''; while (this.isAlpha(this.peek()) || this.isDigit(this.peek())) w += this.advance(); return w; }
    private consumeIdentifier(): string { if (!this.isAlpha(this.peek())) throw new Error(`Expected id at line ${this.ctx.line}`); return this.consumeWord(); }
    private consumeStringLiteral(): string { const q = this.advance(); let v = ''; while (this.peek() !== q && !this.isAtEnd()) v += this.advance(); this.consume(q); return v; }
    private check(e: string): boolean { if (this.isAtEnd()) return false; for (let i = 0; i < e.length; i++) { if (this.ctx.pos + i >= this.ctx.source.length || this.ctx.source[this.ctx.pos + i] !== e[i]) return false; } return true; }
    private isAtEnd(): boolean { return this.ctx.pos >= this.ctx.source.length; }
}