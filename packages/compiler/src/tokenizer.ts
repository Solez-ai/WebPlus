export enum TokenType {
    Keyword,
    Identifier,
    String,
    Number,
    Symbol,
    Operator,
    Comment,
    EOF,
}

export interface Token {
    type: TokenType;
    value: string;
    line: number;
    column: number;
}

export class Tokenizer {
    private source: string;
    private cursor: number = 0;
    private line: number = 1;
    private column: number = 1;

    constructor(source: string) {
        this.source = source;
    }

    tokenize(): Token[] {
        const tokens: Token[] = [];
        while (this.cursor < this.source.length) {
            const char = this.peek();

            if (this.isWhitespace(char)) {
                this.consumeWhitespace();
                continue;
            }

            if (char === '/' && this.peek(1) === '/') {
                this.consumeComment();
                continue;
            }

            if (char === '#') {
                this.consumeComment();
                continue;
            }

            if (char === '/' && this.peek(1) === '*') {
                this.consumeBlockComment();
                continue;
            }

            if (this.isAlpha(char) || char === '_') {
                tokens.push(this.consumeIdentifierOrKeyword());
                continue;
            }

            if (this.isDigit(char)) {
                tokens.push(this.consumeNumber());
                continue;
            }

            if (char === '"' || char === "'") {
                tokens.push(this.consumeString());
                continue;
            }

            if (this.isSymbol(char)) {
                tokens.push(this.consumeSymbol());
                continue;
            }

            if (this.isOperator(char)) {
                tokens.push(this.consumeOperator());
                continue;
            }

            throw new Error(`Unexpected character '${char}' at line ${this.line}, column ${this.column}`);
        }

        tokens.push({ type: TokenType.EOF, value: '', line: this.line, column: this.column });
        return tokens;
    }

    private peek(offset: number = 0): string {
        return this.source[this.cursor + offset] || '';
    }

    private advance(): string {
        const char = this.source[this.cursor++];
        if (char === '\n') {
            this.line++;
            this.column = 1;
        } else {
            this.column++;
        }
        return char;
    }

    private isWhitespace(char: string): boolean {
        return /\s/.test(char);
    }

    private consumeWhitespace() {
        while (this.isWhitespace(this.peek())) {
            this.advance();
        }
    }

    private isAlpha(char: string): boolean {
        return /[a-zA-Z]/.test(char);
    }

    private isDigit(char: string): boolean {
        return /[0-9]/.test(char);
    }

    private isSymbol(char: string): boolean {
        return /[(){}[\].,;:]/.test(char);
    }

    private isOperator(char: string): boolean {
        return /[+\-*\/%=<>!&|?]/.test(char);
    }

    private consumeComment() {
        while (this.peek() !== '\n' && this.cursor < this.source.length) {
            this.advance();
        }
    }

    private consumeBlockComment() {
        this.advance(); // /
        this.advance(); // *
        while (!(this.peek() === '*' && this.peek(1) === '/') && this.cursor < this.source.length) {
            this.advance();
        }
        this.advance(); // *
        this.advance(); // /
    }

    private consumeIdentifierOrKeyword(): Token {
        let value = '';
        const startLine = this.line;
        const startColumn = this.column;

        while (this.isAlpha(this.peek()) || this.isDigit(this.peek()) || this.peek() === '_') {
            value += this.advance();
        }

        const keywords = [
            'import', 'fn', 'void', 'int', 'float', 'double', 'bool', 'string', 'char',
            'route', 'worker', 'return', 'namespace', 'struct', 'alloc',
            'stack', 'arena', 'free', 'true', 'false', 'if', 'else', 'for', 'while', 'size_t'
        ];
        const type = keywords.includes(value) ? TokenType.Keyword : TokenType.Identifier;

        return { type, value, line: startLine, column: startColumn };
    }

    private consumeNumber(): Token {
        let value = '';
        const startLine = this.line;
        const startColumn = this.column;

        while (this.isDigit(this.peek()) || this.peek() === '.') {
            value += this.advance();
        }

        // Support suffixes like 'f' in 3.14f
        if (this.peek() === 'f') {
            value += this.advance();
        }

        return { type: TokenType.Number, value, line: startLine, column: startColumn };
    }

    private consumeString(): Token {
        const quote = this.advance();
        let value = '';
        const startLine = this.line;
        const startColumn = this.column;

        while (this.peek() !== quote && this.cursor < this.source.length) {
            if (this.peek() === '\\') {
                value += this.advance();
            }
            value += this.advance();
        }
        this.advance(); // skip quote

        return { type: TokenType.String, value, line: startLine, column: startColumn };
    }

    private consumeSymbol(): Token {
        const startLine = this.line;
        const startColumn = this.column;
        let value = this.advance();

        // Check for ::
        if (value === ':' && this.peek() === ':') {
            value += this.advance();
        }

        return { type: TokenType.Symbol, value, line: startLine, column: startColumn };
    }

    private consumeOperator(): Token {
        const startLine = this.line;
        const startColumn = this.column;
        let value = this.advance();

        // Multi-char operators
        const next = this.peek();
        if (value === '-' && next === '>') value += this.advance();
        else if (value === '=' && next === '=') value += this.advance();
        else if (value === '!' && next === '=') value += this.advance();
        else if (value === '<' && next === '=') value += this.advance();
        else if (value === '>' && next === '=') value += this.advance();
        else if (value === '&' && next === '&') value += this.advance();
        else if (value === '|' && next === '|') value += this.advance();
        else if (value === '+' && next === '+') value += this.advance();
        else if (value === '-' && next === '-') value += this.advance();
        else if (value === '+' && next === '=') value += this.advance();
        else if (value === '-' && next === '=') value += this.advance();
        else if (value === '*' && next === '=') value += this.advance();
        else if (value === '/' && next === '=') value += this.advance();
        else if (value === '%' && next === '=') value += this.advance();

        return { type: TokenType.Operator, value, line: startLine, column: startColumn };
    }
}
