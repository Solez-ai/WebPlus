import {
    Program,
    Statement,
    Expression,
    NodeType,
    FunctionDeclaration,
    StructDeclaration,
    RouteDeclaration,
    VariableDeclaration,
    BlockStatement,
    ReturnStatement,
    ExpressionStatement,
    IfStatement,
    ForStatement,
    WhileStatement,
    BinaryExpression,
    CallExpression,
    MemberExpression,
    Identifier,
    Literal,
    UnaryExpression,
    LambdaExpression,
    AllocExpression,
    StackExpression,
    ArenaExpression,
    FreeExpression,
    DomGetExpression,
    FetchExpression,
    WorkerSpawnExpression,
    IndexExpression,
    TypeAnnotation,
    PrimitiveType,
} from '../ast';

export class CppGenerator {
    private lines: string[] = [];
    private indentLevel: number = 0;

    generate(program: Program): string {
        this.lines = [];
        this.indentLevel = 0;

        this.generateIncludes();
        this.lines.push('');

        for (const statement of program.body) {
            this.generateStatement(statement);
            this.lines.push('');
        }

        return this.lines.join('\n');
    }

    private generateIncludes(): void {
        const includes = [
            '#include <emscripten.h>',
            '#include <emscripten/bind.h>',
            '#include <emscripten/val.h>',
            '#include <string>',
            '#include <memory>',
            '#include <functional>',
            '#include <vector>',
            '#include <map>',
            '#include <cmath>',
            '#include <cstdio>',
            '#include <cstdlib>',
            '#include "webplus.hpp"',
            '',
            'using namespace emscripten;',
            'using namespace webplus;',
            'using namespace webplus::dom;'
        ];
        this.lines.push(...includes);
    }

    private addLine(line: string): void {
        const indent = '  '.repeat(this.indentLevel);
        this.lines.push(indent + line);
    }

    private addLines(lines: string[]): void {
        const indent = '  '.repeat(this.indentLevel);
        this.lines.push(...lines.map(l => indent + l));
    }

    private generateStatement(statement: Statement): void {
        switch (statement.type) {
            case NodeType.FunctionDeclaration:
                this.generateFunctionDeclaration(statement as FunctionDeclaration);
                break;
            case NodeType.StructDeclaration:
                this.generateStructDeclaration(statement as StructDeclaration);
                break;
            case NodeType.RouteDeclaration:
                this.generateRouteDeclaration(statement as RouteDeclaration);
                break;
            case NodeType.VariableDeclaration:
                this.generateVariableDeclaration(statement as VariableDeclaration);
                break;
            case NodeType.BlockStatement:
                this.generateBlockStatement(statement as BlockStatement);
                break;
            case NodeType.ReturnStatement:
                this.generateReturnStatement(statement as ReturnStatement);
                break;
            case NodeType.ExpressionStatement:
                this.generateExpressionStatement(statement as ExpressionStatement);
                break;
            case NodeType.IfStatement:
                this.generateIfStatement(statement as IfStatement);
                break;
            case NodeType.ForStatement:
                this.generateForStatement(statement as ForStatement);
                break;
            case NodeType.WhileStatement:
                this.generateWhileStatement(statement as WhileStatement);
                break;
        }
    }

    private generateFunctionDeclaration(node: FunctionDeclaration): void {
        let returnType = this.generateType(node.returnType);
        let name = node.name;

        if (name === 'main' && returnType === 'void') {
            returnType = 'int';
        }

        this.addLine(`${returnType} ${name}(${node.parameters.map(p =>
            `${this.generateType(p.paramType)} ${p.name}`
        ).join(', ')}) `);

        this.generateBlockStatement(node.body);
    }

    private generateStructDeclaration(node: StructDeclaration): void {
        this.addLine(`struct ${node.name} {`);
        this.indentLevel++;

        for (const field of node.fields) {
            const typeStr = this.generateType(field.fieldType);
            let init = '';

            if (field.fieldType.isPointer) {
                init = ' = nullptr';
            } else if (typeStr === 'int' || typeStr === 'float' || typeStr === 'double' || typeStr === 'char') {
                init = ' = 0';
            } else if (typeStr === 'bool') {
                init = ' = false';
            }

            this.addLine(`${typeStr} ${field.name}${init};`);
        }

        this.indentLevel--;
        this.addLine('};');
    }

    private generateRouteDeclaration(node: RouteDeclaration): void {
        this.addLine(`// HTTP Route: ${node.method} ${node.path}`);
        this.addLine(`${this.generateType(node.returnType)} route_${this.sanitizeName(node.path)}() `);
        this.generateBlockStatement(node.body);
        this.addLine('');
        this.addLine(`EMSCRIPTEN_BINDINGS(route_${this.sanitizeName(node.path)}) {`);
        this.indentLevel++;
        this.addLine(`function("route_${this.sanitizeName(node.path)}", &route_${this.sanitizeName(node.path)});`);
        this.indentLevel--;
        this.addLine('}');
    }

    private generateVariableDeclaration(node: VariableDeclaration): void {
        const line = `${this.generateType(node.varType)} ${node.name}`;
        this.addLine(node.initializer ? `${line} = ${this.generateExpression(node.initializer)};` : `${line};`);
    }

    private generateBlockStatement(node: BlockStatement): void {
        this.addLine('{');
        this.indentLevel++;

        for (const statement of node.statements) {
            if (statement.type === NodeType.IfStatement ||
                statement.type === NodeType.ForStatement ||
                statement.type === NodeType.WhileStatement ||
                statement.type === NodeType.BlockStatement ||
                statement.type === NodeType.FunctionDeclaration ||
                statement.type === NodeType.StructDeclaration) {
                this.generateStatement(statement);
            } else {
                this.generateStatement(statement);
                this.lines.push('');
            }
        }

        this.indentLevel--;
        this.addLine('}');
    }

    private generateReturnStatement(node: ReturnStatement): void {
        const line = node.argument ? `return ${this.generateExpression(node.argument)}` : 'return';
        this.addLine(`${line};`);
    }

    private generateExpressionStatement(node: ExpressionStatement): void {
        this.addLine(`${this.generateExpression(node.expression)};`);
    }

    private generateIfStatement(node: IfStatement): void {
        this.addLine(`if (${this.generateExpression(node.condition)}) `);
        this.generateStatement(node.consequent);

        if (node.alternate) {
            this.addLine('else ');
            this.generateStatement(node.alternate);
        }
    }

    private generateForStatement(node: ForStatement): void {
        let initStr = '';
        if (node.initializer) {
            const oldLines = this.lines;
            const oldIndent = this.indentLevel;
            this.lines = [];
            this.indentLevel = 0;
            this.generateStatement(node.initializer);
            initStr = this.lines.join(' ').replace(/;\s*$/, '');
            this.lines = oldLines;
            this.indentLevel = oldIndent;
        }

        const condStr = node.condition ? this.generateExpression(node.condition) : '';
        const incrStr = node.increment ? this.generateExpression(node.increment) : '';

        this.addLine(`for (${initStr}; ${condStr}; ${incrStr}) `);
        this.generateStatement(node.body);
    }

    private generateWhileStatement(node: WhileStatement): void {
        this.addLine(`while (${this.generateExpression(node.condition)}) `);
        this.generateStatement(node.body);
    }

    private generateExpression(expression: Expression): string {
        switch (expression.type) {
            case NodeType.BinaryExpression:
                return this.generateBinaryExpression(expression as BinaryExpression);
            case NodeType.CallExpression:
                return this.generateCallExpression(expression as CallExpression);
            case NodeType.MemberExpression:
                return this.generateMemberExpression(expression as MemberExpression);
            case NodeType.Identifier:
                return this.generateIdentifier(expression as Identifier);
            case NodeType.Literal:
                return this.generateLiteral(expression as Literal);
            case NodeType.UnaryExpression:
                return this.generateUnaryExpression(expression as UnaryExpression);
            case NodeType.LambdaExpression:
                return this.generateLambdaExpression(expression as LambdaExpression);
            case NodeType.AllocExpression:
                return this.generateAllocExpression(expression as AllocExpression);
            case NodeType.StackExpression:
                return this.generateStackExpression(expression as StackExpression);
            case NodeType.ArenaExpression:
                return this.generateArenaExpression(expression as ArenaExpression);
            case NodeType.FreeExpression:
                return this.generateFreeExpression(expression as FreeExpression);
            case NodeType.DomGetExpression:
                return this.generateDomGetExpression(expression as DomGetExpression);
            case NodeType.FetchExpression:
                return this.generateFetchExpression(expression as FetchExpression);
            case NodeType.WorkerSpawnExpression:
                return this.generateWorkerSpawnExpression(expression as WorkerSpawnExpression);
            case NodeType.IndexExpression:
                return this.generateIndexExpression(expression as IndexExpression);
            default:
                return '';
        }
    }

    private generateUnaryExpression(node: UnaryExpression): string {
        if (node.isPostfix) {
            return `${this.generateExpression(node.target)}${node.operator}`;
        }
        return `${node.operator}${this.generateExpression(node.target)}`;
    }

    private generateLambdaExpression(node: LambdaExpression): string {
        return `[${node.captures}](${node.parameters.map(p =>
            `${this.generateType(p.paramType)} ${p.name}`
        ).join(', ')}) ${this.generateBlockAsString(node.body)}`;
    }

    private generateBlockAsString(node: BlockStatement): string {
        const oldLines = this.lines;
        const oldIndent = this.indentLevel;
        this.lines = [];
        this.indentLevel = 0;

        for (const stmt of node.statements) {
            this.generateStatement(stmt);
        }

        const result = '{ ' + this.lines.join('; ') + ' }';
        this.lines = oldLines;
        this.indentLevel = oldIndent;
        return result;
    }

    private generateBinaryExpression(node: BinaryExpression): string {
        return `(${this.generateExpression(node.left)} ${node.operator} ${this.generateExpression(node.right)})`;
    }

    private generateCallExpression(node: CallExpression): string {
        let result = this.generateExpression(node.callee);

        if (node.templateArgs && node.templateArgs.length > 0) {
            result += `<${node.templateArgs.map(t => this.generateType(t)).join(', ')}>`;
        }

        result += `(${node.arguments.map(a => this.generateExpression(a)).join(', ')})`;
        return result;
    }

    private generateMemberExpression(node: MemberExpression): string {
        return `${this.generateExpression(node.object)}${node.isPointer ? '->' : '.'}${node.property}`;
    }

    private generateIdentifier(node: Identifier): string {
        return node.name;
    }

    private generateLiteral(node: Literal): string {
        if (node.literalType === PrimitiveType.String) {
            return `"${node.value}"`;
        }
        if (node.literalType === PrimitiveType.Bool) {
            return node.value ? 'true' : 'false';
        }
        return String(node.value);
    }

    private generateAllocExpression(node: AllocExpression): string {
        return `webplus::alloc<${this.generateType(node.allocType)}>(${this.generateExpression(node.size)})`;
    }

    private generateStackExpression(node: StackExpression): string {
        return `${node.allocType.baseType}[${this.generateExpression(node.size)}]`;
    }

    private generateArenaExpression(node: ArenaExpression): string {
        return `arena.allocate(${this.generateExpression(node.size)})`;
    }

    private generateFreeExpression(node: FreeExpression): string {
        return `webplus::free_ptr(${this.generateExpression(node.pointer)})`;
    }

    private generateDomGetExpression(node: DomGetExpression): string {
        return `webplus::dom::get(${this.generateExpression(node.selector)})`;
    }

    private generateFetchExpression(node: FetchExpression): string {
        return `webplus::fetch(${this.generateExpression(node.url)})`;
    }

    private generateWorkerSpawnExpression(node: WorkerSpawnExpression): string {
        return `webplus::worker::spawn(${this.generateExpression(node.callback)})`;
    }

    private generateIndexExpression(node: IndexExpression): string {
        return `${this.generateExpression(node.object)}[${this.generateExpression(node.index)}]`;
    }

    private generateType(type: TypeAnnotation): string {
        let cppType = this.mapTypeToCpp(type.baseType);
        if (type.isPointer) cppType += '*';
        else if (type.isReference) cppType += '&';
        return cppType;
    }

    private mapTypeToCpp(type: string): string {
        const typeMap: Record<string, string> = {
            'int': 'int', 'float': 'float', 'double': 'double',
            'bool': 'bool', 'char': 'char', 'string': 'webplus::String',
            'void': 'void', 'Response': 'val', 'auto': 'auto',
        };
        return typeMap[type] || type;
    }

    private sanitizeName(name: string): string {
        return name.replace(/[^a-zA-Z0-9_]/g, '_');
    }
}