import { Token, TokenType } from './tokenizer';

export interface ASTNode {
    type: string;
}

export interface Program extends ASTNode {
    type: 'Program';
    body: ASTNode[];
}

export interface ImportDeclaration extends ASTNode {
    type: 'ImportDeclaration';
    source: string;
}

export interface StructDeclaration extends ASTNode {
    type: 'StructDeclaration';
    name: string;
    fields: Array<{ name: string; type: string }>;
}

export interface RouteDeclaration extends ASTNode {
    type: 'RouteDeclaration';
    method: string;
    path: string;
    returnType: string;
    body: ASTNode[];
}

export interface FunctionDeclaration extends ASTNode {
    type: 'FunctionDeclaration';
    name: string;
    returnType: string;
    params: Array<{ name: string; type: string }>;
    body: ASTNode[];
}

export interface VariableDeclaration extends ASTNode {
    type: 'VariableDeclaration';
    varType: string;
    name: string;
    init: ASTNode | null;
    isArray?: boolean;
}

export interface CallExpression extends ASTNode {
    type: 'CallExpression';
    callee: ASTNode;
    arguments: ASTNode[];
    templateArgs?: string[];
}

export interface MemberExpression extends ASTNode {
    type: 'MemberExpression';
    object: ASTNode;
    property: string | ASTNode;
    isPointer: boolean;
    isNamespace: boolean;
    isComputed?: boolean;
}

export interface BinaryExpression extends ASTNode {
    type: 'BinaryExpression';
    operator: string;
    left: ASTNode;
    right: ASTNode;
}

export interface ConditionalExpression extends ASTNode {
    type: 'ConditionalExpression';
    test: ASTNode;
    consequent: ASTNode;
    alternate: ASTNode;
}

export interface CastExpression extends ASTNode {
    type: 'CastExpression';
    targetType: string;
    argument: ASTNode;
}

export interface UnaryExpression extends ASTNode {
    type: 'UnaryExpression';
    operator: string;
    argument: ASTNode;
    isPostfix?: boolean;
}

export interface LambdaExpression extends ASTNode {
    type: 'LambdaExpression';
    captures: string;
    params: Array<{ name: string; type: string }>;
    body: ASTNode[];
}

export interface ObjectLiteral extends ASTNode {
    type: 'ObjectLiteral';
    properties: Array<{ key: string; value: ASTNode }>;
}

export interface IfStatement extends ASTNode {
    type: 'IfStatement';
    test: ASTNode;
    consequent: ASTNode[];
    alternate: ASTNode[] | null;
}

export interface ForStatement extends ASTNode {
    type: 'ForStatement';
    init: ASTNode | null;
    test: ASTNode | null;
    update: ASTNode | null;
    body: ASTNode[];
}

export interface WhileStatement extends ASTNode {
    type: 'WhileStatement';
    test: ASTNode;
    body: ASTNode[];
}

export interface ReturnStatement extends ASTNode {
    type: 'ReturnStatement';
    argument: ASTNode | null;
}

export interface Identifier extends ASTNode {
    type: 'Identifier';
    name: string;
}

export interface Literal extends ASTNode {
    type: 'Literal';
    value: any;
    raw: string;
}

export class Parser {
    private tokens: Token[];
    private cursor: number = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    parse(): Program {
        const program: Program = { type: 'Program', body: [] };
        let safety = 0;
        const maxIter = this.tokens.length; // Max iterations should be one per token at worst
        while (!this.isAtEnd() && safety < maxIter) {
            safety++;
            const startCursor = this.cursor;
            const node = this.parseTopLevel();
            if (node) program.body.push(node);
            if (this.cursor === startCursor) {
                this.advance(); // Skip 1 token if no progress
            }
        }
        return program;
    }

    private isAtEnd(): boolean {
        return this.peek().type === TokenType.EOF;
    }

    private peek(offset: number = 0): Token {
        return this.tokens[this.cursor + offset] || this.tokens[this.tokens.length - 1];
    }

    private advance(): Token {
        const token = this.tokens[this.cursor++];
        // console.log(`[ADVANCE] ${token.value} (${TokenType[token.type]}) at ${token.line}:${token.column}`);
        return token;
    }

    private match(type: TokenType, value?: string): boolean {
        const token = this.peek();
        if (token.type === type && (!value || token.value === value)) {
            this.advance();
            return true;
        }
        return false;
    }

    private expect(type: TokenType, value?: string): Token {
        const token = this.peek();
        if (token.type === type && (!value || token.value === value)) {
            return this.advance();
        }
        throw new Error(`Expected ${value || TokenType[type]} at line ${token.line}, column ${token.column}, got '${token.value}'`);
    }

    private parseTopLevel(): ASTNode | null {
        if (this.match(TokenType.Keyword, 'import')) return this.parseImport();
        if (this.match(TokenType.Keyword, 'struct')) return this.parseStruct();
        if (this.match(TokenType.Keyword, 'route')) return this.parseRoute();

        // Support 'fn' keyword for function declarations
        if (this.match(TokenType.Keyword, 'fn')) {
            const name = this.expect(TokenType.Identifier).value;
            this.expect(TokenType.Symbol, '(');
            return this.parseFunction(name, 'void');
        }

        const startCursor = this.cursor;
        if (this.isLookingAtType()) {
            try {
                const type = this.parseTypeString();
                if (this.peek().type === TokenType.Identifier) {
                    const name = this.expect(TokenType.Identifier).value;
                    if (this.match(TokenType.Symbol, '(')) {
                        return this.parseFunction(name, type);
                    } else {
                        return this.parseVariable(name, type);
                    }
                }
            } catch (e) {
                // backtrack handled below
            }
        }
        this.cursor = startCursor;

        return this.parseStatement();
    }

    private isLookingAtType(): boolean {
        const token = this.peek();
        if (token.type === TokenType.Keyword) {
            if (['void', 'int', 'float', 'double', 'bool', 'string', 'char', 'auto', 'size_t'].includes(token.value)) return true;
            if (token.value === 'fn') return false;
        }
        if (token.type === TokenType.Identifier) {
            let i = 1;
            // Handle X::Y or X.Y
            while (this.peek(i).value === '::' || this.peek(i).value === '.') {
                i++;
                if (this.peek(i).type === TokenType.Identifier) i++;
                else break;
            }
            const next = this.peek(i);
            // If followed by *, &, < it's a type (e.g. Int* or List<Int>)
            if (next.value === '*' || next.value === '&' || next.value === '<') return true;
            // If followed by identifier, it's a type (e.g. Vector2 pos)
            // UNLESS the next token is '(', in which case it's likely a call (e.g. dom.render())
            if (next.type === TokenType.Identifier && this.peek(i + 1).value !== '(') return true;
        }
        return false;
    }

    private parseTypeString(): string {
        if (this.match(TokenType.Keyword, 'auto')) return 'auto';

        let type = this.advance().value;
        while (this.peek().value === ':' || this.peek().value === '::' || this.peek().value === '.') {
            if (this.match(TokenType.Symbol, '::')) {
                type += '::';
            } else if (this.match(TokenType.Symbol, '.')) {
                type += '.';
            } else {
                this.expect(TokenType.Symbol, ':');
                if (this.match(TokenType.Symbol, ':')) type += '::';
                else type += ':';
            }
            const part = this.peek();
            if (part.type === TokenType.Identifier || part.type === TokenType.Keyword) {
                type += this.advance().value;
            } else {
                this.expect(TokenType.Identifier);
            }
        }

        while (this.match(TokenType.Operator, '<')) {
            type += '<' + this.parseTypeString() + '>';
            this.match(TokenType.Operator, '>');
        }
        while (this.peek().value === '*' || this.peek().value === '&') {
            type += this.advance().value;
        }
        return type;
    }

    private parseImport(): ImportDeclaration {
        let source = '';
        const startLine = this.peek().line;
        while (this.peek().line === startLine && (this.peek().type === TokenType.Identifier || this.peek().value === '.' || this.peek().value === '::')) {
            source += this.advance().value;
        }
        this.match(TokenType.Symbol, ';');
        return { type: 'ImportDeclaration', source };
    }

    private parseStruct(): StructDeclaration {
        const name = this.expect(TokenType.Identifier).value;
        this.expect(TokenType.Symbol, '{');
        const fields: Array<{ name: string; type: string }> = [];
        while (!this.match(TokenType.Symbol, '}')) {
            const type = this.parseTypeString();
            const fName = this.expect(TokenType.Identifier).value;
            this.expect(TokenType.Symbol, ';');
            fields.push({ name: fName, type });
        }
        this.match(TokenType.Symbol, ';');
        return { type: 'StructDeclaration', name, fields };
    }

    private parseRoute(): RouteDeclaration {
        const method = this.advance().value;
        const path = this.expect(TokenType.String).value;
        this.expect(TokenType.Operator, '->');
        const returnType = this.parseTypeString();
        const body = this.parseBlock();
        return { type: 'RouteDeclaration', method, path, returnType, body };
    }

    private parseFunction(name: string, returnType: string): FunctionDeclaration {
        const params: Array<{ name: string; type: string }> = [];
        if (this.peek().value !== ')') {
            do {
                const pType = this.parseTypeString();
                const part = this.peek();
                let pName = '';
                if (part.type === TokenType.Identifier || part.type === TokenType.Keyword) {
                    pName = this.advance().value;
                } else {
                    pName = this.expect(TokenType.Identifier).value;
                }
                params.push({ name: pName, type: pType });
            } while (this.match(TokenType.Symbol, ','));
        }
        this.expect(TokenType.Symbol, ')');
        const body = this.parseBlock();
        return { type: 'FunctionDeclaration', name, returnType, params, body };
    }

    private parseVariable(name: string, varType: string): VariableDeclaration {
        let init: ASTNode | null = null;
        let isArray = false;

        // Handle array size: name[32]
        if (this.match(TokenType.Symbol, '[')) {
            isArray = true;
            while (this.peek().value !== ']' && !this.isAtEnd()) {
                this.advance();
            }
            this.expect(TokenType.Symbol, ']');
        }

        if (this.match(TokenType.Operator, '=')) {
            init = this.parseExpression();
        }
        this.match(TokenType.Symbol, ';');
        return { type: 'VariableDeclaration', varType, name, init, isArray };
    }

    private parseBlock(): ASTNode[] {
        this.expect(TokenType.Symbol, '{');
        const body: ASTNode[] = [];
        while (!this.match(TokenType.Symbol, '}') && !this.isAtEnd()) {
            body.push(this.parseStatement());
        }
        return body;
    }

    private parseStatement(): ASTNode {
        if (this.match(TokenType.Keyword, 'if')) return this.parseIf();
        if (this.match(TokenType.Keyword, 'for')) return this.parseFor();
        if (this.match(TokenType.Keyword, 'while')) return this.parseWhile();
        if (this.match(TokenType.Keyword, 'return')) return this.parseReturn();

        const startCursor = this.cursor;
        if (this.isLookingAtType()) {
            try {
                const type = this.parseTypeString();
                if (this.peek().type === TokenType.Identifier) {
                    const next = this.peek(1).value;
                    if (next === ';' || next === '=' || next === '[' || next === ')' || next === ',') {
                        const name = this.advance().value;
                        return this.parseVariable(name, type);
                    }
                }
            } catch (e) {
                // backtrack handled below
            }
        }
        this.cursor = startCursor;

        const expr = this.parseExpression();
        this.match(TokenType.Symbol, ';');
        return expr;
    }

    private parseIf(): IfStatement {
        this.expect(TokenType.Symbol, '(');
        const test = this.parseExpression();
        this.expect(TokenType.Symbol, ')');
        const consequent = this.peek().value === '{' ? this.parseBlock() : [this.parseStatement()];
        let alternate: ASTNode[] | null = null;
        if (this.match(TokenType.Keyword, 'else')) {
            if (this.peek().value === '{') {
                alternate = this.parseBlock();
            } else {
                alternate = [this.parseStatement()];
            }
        }
        return { type: 'IfStatement', test, consequent, alternate };
    }

    private parseWhile(): WhileStatement {
        this.expect(TokenType.Symbol, '(');
        const test = this.parseExpression();
        this.expect(TokenType.Symbol, ')');
        const body = this.peek().value === '{' ? this.parseBlock() : [this.parseStatement()];
        return { type: 'WhileStatement', test, body };
    }

    private parseFor(): ForStatement {
        this.expect(TokenType.Symbol, '(');
        let init: ASTNode | null = null;
        if (!this.match(TokenType.Symbol, ';')) {
            init = this.parseStatement();
        }
        let test: ASTNode | null = null;
        if (!this.match(TokenType.Symbol, ';')) {
            test = this.parseExpression();
            this.match(TokenType.Symbol, ';');
        }
        let update: ASTNode | null = null;
        if (!this.match(TokenType.Symbol, ')')) {
            update = this.parseExpression();
            this.match(TokenType.Symbol, ')');
        }
        const body = this.peek().value === '{' ? this.parseBlock() : [this.parseStatement()];
        return { type: 'ForStatement', init, test, update, body };
    }

    private parseReturn(): ReturnStatement {
        let arg: ASTNode | null = null;
        if (!this.match(TokenType.Symbol, ';')) {
            arg = this.parseExpression();
            this.match(TokenType.Symbol, ';');
        }
        return { type: 'ReturnStatement', argument: arg };
    }

    private parseExpression(): ASTNode {
        return this.parseAssignment();
    }

    private parseAssignment(): ASTNode {
        let left = this.parseConditional();
        const operators = ['=', '+=', '-=', '*=', '/=', '%='];
        const currentOp = this.peek().value;
        if (this.peek().type === TokenType.Operator && operators.includes(currentOp)) {
            this.advance();
            const right = this.parseAssignment();
            return { type: 'BinaryExpression', operator: currentOp, left, right } as BinaryExpression;
        }
        return left;
    }

    private parseConditional(): ASTNode {
        let left = this.parseLogical();
        if (this.match(TokenType.Operator, '?')) {
            const consequent = this.parseExpression();
            this.expect(TokenType.Symbol, ':');
            const alternate = this.parseConditional();
            return { type: 'ConditionalExpression', test: left, consequent, alternate } as ConditionalExpression;
        }
        return left;
    }

    private parseLogical(): ASTNode {
        let left = this.parseComparison();
        while (this.peek().value === '&&' || this.peek().value === '||') {
            const op = this.advance().value;
            const right = this.parseComparison();
            left = { type: 'BinaryExpression', operator: op, left, right } as BinaryExpression;
        }
        return left;
    }

    private parseComparison(): ASTNode {
        let left = this.parseAdditive();
        while (['<', '>', '<=', '>=', '==', '!='].includes(this.peek().value)) {
            const op = this.advance().value;
            const right = this.parseAdditive();
            left = { type: 'BinaryExpression', operator: op, left, right } as BinaryExpression;
        }
        return left;
    }

    private parseAdditive(): ASTNode {
        let left = this.parseMultiplicative();
        while (['+', '-'].includes(this.peek().value)) {
            const op = this.advance().value;
            const right = this.parseMultiplicative();
            left = { type: 'BinaryExpression', operator: op, left, right } as BinaryExpression;
        }
        return left;
    }

    private parseMultiplicative(): ASTNode {
        let left = this.parseUnary();
        while (['*', '/', '%'].includes(this.peek().value)) {
            const op = this.advance().value;
            const right = this.parseMultiplicative();
            left = { type: 'BinaryExpression', operator: op, left, right } as BinaryExpression;
        }
        return left;
    }

    private parseUnary(): ASTNode {
        const token = this.peek();
        if (['!', '-', '++', '--', '*', '&'].includes(token.value)) {
            const op = this.advance().value;
            const arg = this.parseUnary();
            return { type: 'UnaryExpression', operator: op, argument: arg } as UnaryExpression;
        }

        // C-style cast: (type)expr
        if (token.value === '(') {
            const startCursor = this.cursor;
            this.advance(); // consume (
            if (this.isLookingAtType()) {
                try {
                    const targetType = this.parseTypeString();
                    if (this.match(TokenType.Symbol, ')')) {
                        const argument = this.parseUnary();
                        return { type: 'CastExpression', targetType, argument } as any;
                    }
                } catch (e) { }
            }
            this.cursor = startCursor; // backtrack
        }

        return this.parseCall();
    }

    private parseCall(): ASTNode {
        let expr = this.parsePrimary();
        while (true) {
            // Only parse < as template if it's 'alloc' or followed by a type and matched >
            if (expr.type === 'Identifier' && (expr as Identifier).name === 'alloc' && this.peek().value === '<') {
                this.advance(); // consume <
                const templateArgs: string[] = [];
                while (this.peek().value !== '>' && !this.isAtEnd()) {
                    templateArgs.push(this.parseTypeString());
                    this.match(TokenType.Symbol, ',');
                }
                this.expect(TokenType.Operator, '>');
                // Need to match ( next to make it a CallExpression immediately or handle it in next loop
                if (this.match(TokenType.Symbol, '(')) {
                    const args: ASTNode[] = [];
                    if (this.peek().value !== ')') {
                        do {
                            args.push(this.parseExpression());
                        } while (this.match(TokenType.Symbol, ','));
                    }
                    this.expect(TokenType.Symbol, ')');
                    expr = { type: 'CallExpression', callee: expr, arguments: args, templateArgs } as CallExpression;
                }
            } else if (this.match(TokenType.Symbol, '(')) {
                const args: ASTNode[] = [];
                if (this.peek().value !== ')') {
                    do {
                        args.push(this.parseExpression());
                    } while (this.match(TokenType.Symbol, ','));
                }
                this.expect(TokenType.Symbol, ')');
                expr = { type: 'CallExpression', callee: expr, arguments: args } as CallExpression;
            } else if (this.match(TokenType.Symbol, '.') || this.match(TokenType.Operator, '->') || this.match(TokenType.Symbol, '::')) {
                const op = this.tokens[this.cursor - 1].value;
                const part = this.peek();
                let prop = '';
                if (part.type === TokenType.Identifier || part.type === TokenType.Keyword) {
                    prop = this.advance().value;
                } else {
                    prop = this.expect(TokenType.Identifier).value;
                }
                expr = {
                    type: 'MemberExpression',
                    object: expr,
                    property: prop,
                    isPointer: op === '->',
                    isNamespace: op === '::'
                } as MemberExpression;
            } else if (this.match(TokenType.Symbol, '[')) {
                const index = this.parseExpression();
                this.expect(TokenType.Symbol, ']');
                expr = {
                    type: 'MemberExpression',
                    object: expr,
                    property: index,
                    isPointer: false,
                    isNamespace: false,
                    isComputed: true
                } as MemberExpression;
            } else if (this.peek().value === '++' || this.peek().value === '--') {
                const op = this.advance().value;
                expr = {
                    type: 'UnaryExpression',
                    operator: op,
                    argument: expr,
                    isPostfix: true
                } as UnaryExpression;
            } else {
                break;
            }
        }
        return expr;
    }

    private parsePrimary(): ASTNode {
        const token = this.peek();

        if (token.value === '[') return this.parseLambda();
        if (token.value === '{') return this.parseObjectLiteral();

        if (this.match(TokenType.Number)) return { type: 'Literal', value: parseFloat(token.value), raw: token.value } as Literal;
        if (this.match(TokenType.String)) return { type: 'Literal', value: token.value, raw: `"${token.value}"` } as Literal;
        if (this.match(TokenType.Keyword, 'true')) return { type: 'Literal', value: true, raw: 'true' } as Literal;
        if (this.match(TokenType.Keyword, 'false')) return { type: 'Literal', value: false, raw: 'false' } as Literal;
        if (this.match(TokenType.Identifier)) return { type: 'Identifier', name: token.value } as Identifier;
        if (this.match(TokenType.Keyword)) return { type: 'Identifier', name: token.value } as Identifier;

        if (this.match(TokenType.Symbol, '(')) {
            const expr = this.parseExpression();
            this.expect(TokenType.Symbol, ')');
            return expr;
        }

        throw new Error(`Unexpected token '${token.value}' at line ${token.line}, column ${token.column}`);
    }

    private parseLambda(): LambdaExpression {
        this.match(TokenType.Symbol, '[');
        let captures = '';
        while (this.peek().value !== ']') {
            captures += this.advance().value;
        }
        this.expect(TokenType.Symbol, ']');

        let params: Array<{ name: string; type: string }> = [];
        if (this.match(TokenType.Symbol, '(')) {
            if (this.peek().value !== ')') {
                do {
                    const pType = this.parseTypeString();
                    const pName = this.expect(TokenType.Identifier).value;
                    params.push({ name: pName, type: pType });
                } while (this.match(TokenType.Symbol, ','));
            }
            this.expect(TokenType.Symbol, ')');
        }

        const body = this.parseBlock();
        return { type: 'LambdaExpression', captures, params, body };
    }

    private parseObjectLiteral(): ObjectLiteral | ASTNode {
        this.expect(TokenType.Symbol, '{');
        const properties: Array<{ key: string; value: ASTNode }> = [];
        const items: ASTNode[] = [];

        if (this.peek().value !== '}') {
            const first = this.parseExpression();
            if (this.match(TokenType.Symbol, ':')) {
                // It's an object
                const firstVal = this.parseExpression();
                properties.push({ key: (first as Identifier).name || (first as Literal).value, value: firstVal });
                while (this.match(TokenType.Symbol, ',')) {
                    const key = this.advance().value;
                    this.expect(TokenType.Symbol, ':');
                    const value = this.parseExpression();
                    properties.push({ key, value });
                }
            } else {
                // It's an array/list
                items.push(first);
                while (this.match(TokenType.Symbol, ',')) {
                    items.push(this.parseExpression());
                }
            }
        }
        this.expect(TokenType.Symbol, '}');

        if (items.length > 0) {
            return { type: 'Literal', value: items, raw: `[${items.map(i => this.generate(i)).join(', ')}]` } as any;
        }
        return { type: 'ObjectLiteral', properties };
    }

    private generate(node: ASTNode): string {
        // Simple internal generator for Literal raw values
        if (node.type === 'Literal') return (node as Literal).raw;
        if (node.type === 'Identifier') return (node as Identifier).name;
        return '';
    }
}
