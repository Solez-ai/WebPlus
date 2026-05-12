// Simple Optimizer - Constant Folding and Dead Code Elimination

import {
    Program, Statement, Expression, NodeType,
    FunctionDeclaration, StructDeclaration, VariableDeclaration,
    BinaryExpression, UnaryExpression, Literal, Identifier,
    ReturnStatement, IfStatement, ForStatement, WhileStatement,
    ExpressionStatement, BlockStatement
} from './ast';

export interface OptimizationOptions {
    constantFolding?: boolean;
    deadCodeElimination?: boolean;
    inlineLiterals?: boolean;
}

export class Optimizer {
    private options: OptimizationOptions;

    constructor(options: OptimizationOptions = {}) {
        this.options = {
            constantFolding: options.constantFolding ?? true,
            deadCodeElimination: options.deadCodeElimination ?? true,
            inlineLiterals: options.inlineLiterals ?? true
        };
    }

    optimize(program: Program): Program {
        let result = { ...program, body: [...program.body] };

        if (this.options.constantFolding) {
            result = this.constantFoldProgram(result);
        }

        if (this.options.deadCodeElimination) {
            result = this.eliminateDeadCode(result);
        }

        return result;
    }

    private constantFoldProgram(program: Program): Program {
        return {
            ...program,
            body: program.body.map(stmt => this.constantFoldStatement(stmt)).filter(Boolean) as Statement[]
        };
    }

    private constantFoldStatement(stmt: Statement): Statement {
        switch (stmt.type) {
            case NodeType.FunctionDeclaration:
                return {
                    ...stmt,
                    body: this.constantFoldBlock(stmt.body)
                };
            case NodeType.IfStatement:
                return {
                    ...stmt,
                    condition: this.constantFoldExpression(stmt.condition),
                    consequent: this.constantFoldStatement(stmt.consequent) as BlockStatement,
                    alternate: stmt.alternate ? this.constantFoldStatement(stmt.alternate) : null
                };
            case NodeType.ForStatement:
                return {
                    ...stmt,
                    condition: stmt.condition ? this.constantFoldExpression(stmt.condition) : null,
                    increment: stmt.increment ? this.constantFoldExpression(stmt.increment) : null,
                    body: this.constantFoldStatement(stmt.body) as BlockStatement
                };
            case NodeType.WhileStatement:
                return {
                    ...stmt,
                    condition: this.constantFoldExpression(stmt.condition),
                    body: this.constantFoldStatement(stmt.body) as BlockStatement
                };
            case NodeType.BlockStatement:
                return {
                    ...stmt,
                    statements: stmt.statements
                        .map(s => this.constantFoldStatement(s))
                        .filter(Boolean) as Statement[]
                };
            case NodeType.ExpressionStatement:
                return {
                    ...stmt,
                    expression: this.constantFoldExpression(stmt.expression)
                };
            case NodeType.ReturnStatement:
                return {
                    ...stmt,
                    argument: stmt.argument ? this.constantFoldExpression(stmt.argument) : null
                };
            case NodeType.VariableDeclaration:
                return {
                    ...stmt,
                    initializer: stmt.initializer ? this.constantFoldExpression(stmt.initializer) : null
                };
            default:
                return stmt;
        }
    }

    private constantFoldBlock(block: BlockStatement): BlockStatement {
        return {
            ...block,
            statements: block.statements
                .map(s => this.constantFoldStatement(s))
                .filter(Boolean) as Statement[]
        };
    }

    private constantFoldExpression(expr: Expression): Expression {
        switch (expr.type) {
            case NodeType.BinaryExpression: {
                const binExpr = expr as BinaryExpression;
                const left = this.constantFoldExpression(binExpr.left);
                const right = this.constantFoldExpression(binExpr.right);

                // Try to evaluate constant expressions
                if (left.type === NodeType.Literal && right.type === NodeType.Literal) {
                    const result = this.evaluateBinaryOp(
                        left as Literal,
                        binExpr.operator,
                        right as Literal
                    );
                    if (result !== null) return result;
                }

                return { ...binExpr, left, right };
            }

            case NodeType.UnaryExpression: {
                const unaryExpr = expr as UnaryExpression;
                const target = this.constantFoldExpression(unaryExpr.target);

                if (target.type === NodeType.Literal) {
                    const result = this.evaluateUnaryOp(unaryExpr.operator, target as Literal);
                    if (result !== null) return result;
                }

                return { ...unaryExpr, target };
            }

            default:
                return expr;
        }
    }

    private evaluateBinaryOp(left: Literal, op: string, right: Literal): Literal | null {
        const lv = left.value;
        const rv = right.value;

        if (typeof lv === 'number' && typeof rv === 'number') {
            let result: number;
            switch (op) {
                case '+': result = lv + rv; break;
                case '-': result = lv - rv; break;
                case '*': result = lv * rv; break;
                case '/': if (rv !== 0) result = lv / rv; else return null; break;
                case '%': if (rv !== 0) result = lv % rv; else return null; break;
                case '==': return { type: NodeType.Literal, value: lv === rv, literalType: left.literalType };
                case '!=': return { type: NodeType.Literal, value: lv !== rv, literalType: left.literalType };
                case '<': return { type: NodeType.Literal, value: lv < rv, literalType: left.literalType };
                case '>': return { type: NodeType.Literal, value: lv > rv, literalType: left.literalType };
                case '<=': return { type: NodeType.Literal, value: lv <= rv, literalType: left.literalType };
                case '>=': return { type: NodeType.Literal, value: lv >= rv, literalType: left.literalType };
                case '&&': return { type: NodeType.Literal, value: lv && rv, literalType: left.literalType };
                case '||': return { type: NodeType.Literal, value: lv || rv, literalType: left.literalType };
                default: return null;
            }
            return { type: NodeType.Literal, value: result, literalType: left.literalType };
        }

        if (typeof lv === 'string' && typeof rv === 'string') {
            switch (op) {
                case '+': return { type: NodeType.Literal, value: lv + rv, literalType: left.literalType };
                case '==': return { type: NodeType.Literal, value: lv === rv, literalType: left.literalType };
                case '!=': return { type: NodeType.Literal, value: lv !== rv, literalType: left.literalType };
            }
        }

        return null;
    }

    private evaluateUnaryOp(op: string, expr: Literal): Literal | null {
        const v = expr.value;

        if (typeof v === 'number') {
            switch (op) {
                case '-': return { type: NodeType.Literal, value: -v, literalType: expr.literalType };
                case '+': return { type: NodeType.Literal, value: v, literalType: expr.literalType };
                case '!': return { type: NodeType.Literal, value: !v, literalType: expr.literalType };
            }
        }

        if (typeof v === 'boolean') {
            switch (op) {
                case '!': return { type: NodeType.Literal, value: !v, literalType: expr.literalType };
            }
        }

        return null;
    }

    private eliminateDeadCode(program: Program): Program {
        return {
            ...program,
            body: program.body.map(stmt => this.eliminateDeadStatement(stmt)).filter(Boolean) as Statement[]
        };
    }

    private eliminateDeadStatement(stmt: Statement): Statement | null {
        if (stmt.type === NodeType.IfStatement) {
            const ifStmt = stmt as IfStatement;
            const cond = this.isConstantTrue(ifStmt.condition);

            if (cond === true) {
                // Always true - keep only consequent
                return this.eliminateDeadStatement(ifStmt.consequent);
            } else if (cond === false) {
                // Always false - keep alternate if exists
                if (ifStmt.alternate) {
                    return this.eliminateDeadStatement(ifStmt.alternate);
                }
                return null;
            }
        }

        return stmt;
    }

    private isConstantTrue(expr: Expression): boolean | null {
        if (expr.type === NodeType.Literal) {
            const lit = expr as Literal;
            if (typeof lit.value === 'boolean') return lit.value;
            if (typeof lit.value === 'number') return lit.value !== 0;
        }
        return null;
    }
}

// Export standalone functions for quick optimization
export function optimizeAST(program: Program, options?: OptimizationOptions): Program {
    const optimizer = new Optimizer(options);
    return optimizer.optimize(program);
}

// Constant folding without full optimization pass
export function foldConstants(expr: Expression): Expression {
    const optimizer = new Optimizer({ constantFolding: true, deadCodeElimination: false });
    // This is a simplified version - full implementation would need more work
    return expr;
}