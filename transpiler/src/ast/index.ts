export enum NodeType {
    Program = 'Program',
    FunctionDeclaration = 'FunctionDeclaration',
    StructDeclaration = 'StructDeclaration',
    VariableDeclaration = 'VariableDeclaration',
    RouteDeclaration = 'RouteDeclaration',

    BlockStatement = 'BlockStatement',
    ReturnStatement = 'ReturnStatement',
    ExpressionStatement = 'ExpressionStatement',
    IfStatement = 'IfStatement',
    ForStatement = 'ForStatement',
    WhileStatement = 'WhileStatement',

    BinaryExpression = 'BinaryExpression',
    CallExpression = 'CallExpression',
    MemberExpression = 'MemberExpression',
    Identifier = 'Identifier',
    Literal = 'Literal',
    UnaryExpression = 'UnaryExpression',
    LambdaExpression = 'LambdaExpression',

    AllocExpression = 'AllocExpression',
    StackExpression = 'StackExpression',
    ArenaExpression = 'ArenaExpression',
    FreeExpression = 'FreeExpression',

    DomGetExpression = 'DomGetExpression',
    FetchExpression = 'FetchExpression',
    WorkerSpawnExpression = 'WorkerSpawnExpression',
    IndexExpression = 'IndexExpression',
}

export enum PrimitiveType {
    Int = 'int',
    Float = 'float',
    Double = 'double',
    Bool = 'bool',
    Char = 'char',
    String = 'string',
    Void = 'void',
}

export enum HttpMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
    PATCH = 'PATCH',
}

export interface ASTNode {
    type: NodeType;
    loc?: SourceLocation;
}

export interface SourceLocation {
    start: Position;
    end: Position;
}

export interface Position {
    line: number;
    column: number;
}

export interface Program extends ASTNode {
    type: NodeType.Program;
    body: Statement[];
}

export interface FunctionDeclaration extends ASTNode {
    type: NodeType.FunctionDeclaration;
    name: string;
    returnType: TypeAnnotation;
    parameters: Parameter[];
    body: BlockStatement;
}

export interface StructDeclaration extends ASTNode {
    type: NodeType.StructDeclaration;
    name: string;
    fields: StructField[];
}

export interface StructField {
    name: string;
    fieldType: TypeAnnotation;
}

export interface Parameter {
    name: string;
    paramType: TypeAnnotation;
}

export interface TypeAnnotation {
    baseType: PrimitiveType | string;
    isPointer: boolean;
    isReference: boolean;
}

export interface RouteDeclaration extends ASTNode {
    type: NodeType.RouteDeclaration;
    method: HttpMethod;
    path: string;
    returnType: TypeAnnotation;
    body: BlockStatement;
}

export interface BlockStatement extends ASTNode {
    type: NodeType.BlockStatement;
    statements: Statement[];
}

export interface ReturnStatement extends ASTNode {
    type: NodeType.ReturnStatement;
    argument: Expression | null;
}

export interface ExpressionStatement extends ASTNode {
    type: NodeType.ExpressionStatement;
    expression: Expression;
}

export interface IfStatement extends ASTNode {
    type: NodeType.IfStatement;
    condition: Expression;
    consequent: Statement;
    alternate: Statement | null;
}

export interface ForStatement extends ASTNode {
    type: NodeType.ForStatement;
    initializer: Statement | null;
    condition: Expression | null;
    increment: Expression | null;
    body: Statement;
}

export interface WhileStatement extends ASTNode {
    type: NodeType.WhileStatement;
    condition: Expression;
    body: Statement;
}

export interface VariableDeclaration extends ASTNode {
    type: NodeType.VariableDeclaration;
    varType: TypeAnnotation;
    name: string;
    initializer: Expression | null;
}

export interface BinaryExpression extends ASTNode {
    type: NodeType.BinaryExpression;
    operator: string;
    left: Expression;
    right: Expression;
}

export interface CallExpression extends ASTNode {
    type: NodeType.CallExpression;
    callee: Expression;
    arguments: Expression[];
    templateArgs?: TypeAnnotation[];
}

export interface UnaryExpression extends ASTNode {
    type: NodeType.UnaryExpression;
    operator: string;
    target: Expression;
    isPostfix: boolean;
}

export interface MemberExpression extends ASTNode {
    type: NodeType.MemberExpression;
    object: Expression;
    property: string;
    isPointer: boolean;
}

export interface Identifier extends ASTNode {
    type: NodeType.Identifier;
    name: string;
}

export interface Literal extends ASTNode {
    type: NodeType.Literal;
    value: any;
    literalType: PrimitiveType;
}

export interface LambdaExpression extends ASTNode {
    type: NodeType.LambdaExpression;
    captures: string;
    parameters: Parameter[];
    body: BlockStatement;
}

export interface AllocExpression extends ASTNode {
    type: NodeType.AllocExpression;
    allocType: TypeAnnotation;
    size: Expression;
}

export interface StackExpression extends ASTNode {
    type: NodeType.StackExpression;
    allocType: TypeAnnotation;
    size: Expression;
}

export interface ArenaExpression extends ASTNode {
    type: NodeType.ArenaExpression;
    allocType: TypeAnnotation;
    size: Expression;
}

export interface FreeExpression extends ASTNode {
    type: NodeType.FreeExpression;
    pointer: Expression;
}

export interface DomGetExpression extends ASTNode {
    type: NodeType.DomGetExpression;
    selector: Expression;
}

export interface FetchExpression extends ASTNode {
    type: NodeType.FetchExpression;
    url: Expression;
    options?: Expression;
}

export interface WorkerSpawnExpression extends ASTNode {
    type: NodeType.WorkerSpawnExpression;
    callback: Expression;
}

export interface IndexExpression extends ASTNode {
    type: NodeType.IndexExpression;
    object: Expression;
    index: Expression;
}

export type Statement =
    | FunctionDeclaration
    | StructDeclaration
    | RouteDeclaration
    | BlockStatement
    | ReturnStatement
    | ExpressionStatement
    | IfStatement
    | ForStatement
    | WhileStatement
    | VariableDeclaration;

export type Expression =
    | BinaryExpression
    | CallExpression
    | MemberExpression
    | Identifier
    | Literal
    | UnaryExpression
    | LambdaExpression
    | AllocExpression
    | StackExpression
    | ArenaExpression
    | FreeExpression
    | DomGetExpression
    | FetchExpression
    | WorkerSpawnExpression
    | IndexExpression;
