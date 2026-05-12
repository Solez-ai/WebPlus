import { ASTNode, Program, FunctionDeclaration, CallExpression, MemberExpression, VariableDeclaration, BinaryExpression, Literal, Identifier, IfStatement, ForStatement, ReturnStatement, UnaryExpression, ImportDeclaration, WhileStatement, LambdaExpression, StructDeclaration, RouteDeclaration, ObjectLiteral } from './parser';
import { BROWSER_RUNTIME } from '@webplus/runtime';

export class Transpiler {
  transpile(program: Program): string {
    let output = this.generateRuntime();

    for (const node of program.body) {
      output += this.generate(node) + '\n';
    }

    output += `
(async () => {
  if (typeof main === 'function') {
    await main();
  }
})();
`;
    return output;
  }

  private generateRuntime(): string {
    return BROWSER_RUNTIME;
  }

  private generate(node: ASTNode): string {
    if (!node) return '';

    switch (node.type) {
      case 'Program':
        return (node as Program).body.map(n => this.generate(n)).join('\n');

      case 'StructDeclaration': {
        const sd = node as StructDeclaration;
        return `class ${sd.name} { constructor() { ${sd.fields.map(f => {
          let type = f.type.replace(/\*/g, '').trim();
          const primitives = ['int', 'float', 'double', 'bool', 'string', 'char', 'void', 'size_t', 'auto'];
          if (f.type.includes('*')) return `this.${f.name} = null;`;
          if (primitives.includes(type)) {
            let def = 'null';
            if (['int', 'float', 'double', 'size_t'].includes(type)) def = '0';
            else if (type === 'bool') def = 'false';
            else if (type === 'string') def = '""';
            return `this.${f.name} = ${def};`;
          }
          // Likely another struct
          return `try { this.${f.name} = new ${type.replace('::', '.')}(); } catch(e) { this.${f.name} = null; }`;
        }).join(' ')} } }`;
      }

      case 'RouteDeclaration': {
        const rd = node as RouteDeclaration;
        return `// Route ${rd.method} ${rd.path}\nfunction route_${rd.method.toLowerCase()}_${rd.path.replace(/[^a-z]/g, '_')}() {\n${rd.body.map(s => '  ' + this.generate(s)).join('\n')}\n}`;
      }

      case 'FunctionDeclaration': {
        const fn = node as FunctionDeclaration;
        const params = fn.params.map(p => p.name).join(', ');
        return `async function ${fn.name}(${params}) {\n${fn.body.map(s => '  ' + this.generate(s)).join('\n')}\n}`;
      }

      case 'LambdaExpression': {
        const le = node as LambdaExpression;
        const params = le.params.map(p => p.name).join(', ');
        return `async (${params}) => {\n${le.body.map(s => '  ' + this.generate(s)).join('\n')}\n}`;
      }

      case 'ObjectLiteral': {
        const ol = node as ObjectLiteral;
        return `{ ${ol.properties.map(p => `${p.key}: ${this.generate(p.value)}`).join(', ')} }`;
      }

      case 'VariableDeclaration': {
        const vd = node as VariableDeclaration;
        if (vd.varType.includes('Vector')) {
          return `let ${vd.name} = new webplus.Vector();`;
        }
        let init = vd.init ? ` = ${this.generate(vd.init)}` : '';
        if (vd.isArray && !vd.init) init = ' = { value: "" }';
        return `let ${vd.name}${init};`;
      }

      case 'CallExpression': {
        const call = node as CallExpression;
        const calleeStr = this.generate(call.callee);
        if (calleeStr.startsWith('alloc')) {
          const typeArg = call.templateArgs && call.templateArgs.length > 0 ? call.templateArgs[0].replace(/::/g, '.') : 'null';
          return `await alloc(${call.arguments.map(a => this.generate(a)).join(', ')}, ${typeArg})`;
        }
        const args = call.arguments.map(a => this.generate(a)).join(', ');
        return `await ${calleeStr}(${args})`;
      }

      case 'MemberExpression': {
        const me = node as MemberExpression;
        const obj = this.generate(me.object);
        const prop = typeof me.property === 'string' ? me.property : this.generate(me.property);
        const access = me.isComputed ? `[${prop}]` : `.${prop}`;
        return `${obj}${access}`;
      }

      case 'BinaryExpression': {
        const be = node as BinaryExpression;
        return `(${this.generate(be.left)} ${be.operator} ${this.generate(be.right)})`;
      }

      case 'UnaryExpression': {
        const ue = node as UnaryExpression;
        // Handle pointer vs dereference
        if (ue.operator === '*' || ue.operator === '&') return this.generate(ue.argument);
        if (ue.isPostfix) return `${this.generate(ue.argument)}${ue.operator}`;
        return `${ue.operator}${this.generate(ue.argument)}`;
      }

      case 'IfStatement': {
        const is = node as IfStatement;
        let out = `if (${this.generate(is.test)}) {\n${is.consequent.map(s => '  ' + this.generate(s)).join('\n')}\n}`;
        if (is.alternate) {
          out += ` else {\n${is.alternate.map(s => '  ' + this.generate(s)).join('\n')}\n}`;
        }
        return out;
      }

      case 'WhileStatement': {
        const ws = node as WhileStatement;
        return `while (${this.generate(ws.test)}) {\n${ws.body.map(s => '  ' + this.generate(s)).join('\n')}\n}`;
      }

      case 'ForStatement': {
        const fs = node as ForStatement;
        const init = fs.init ? this.generate(fs.init).replace(/;$/, '') : '';
        const test = fs.test ? this.generate(fs.test) : 'true';
        const update = fs.update ? this.generate(fs.update) : '';
        return `for (${init}; ${test}; ${update}) {\n${fs.body.map(s => '  ' + this.generate(s)).join('\n')}\n}`;
      }

      case 'ReturnStatement': {
        const rs = node as ReturnStatement;
        return `return ${rs.argument ? this.generate(rs.argument) : ''};`;
      }

      case 'Identifier': {
        const id = (node as Identifier).name;
        if (id === 'dom' || id === 'webplus' || id === 'worker') return id;
        return id;
      }

      case 'Literal':
        return (node as Literal).raw;

      case 'ImportDeclaration':
        return `// import ${(node as ImportDeclaration).source}`;

      case 'CastExpression':
        return this.generate((node as any).argument);

      case 'ConditionalExpression': {
        const ce = node as any; // Cast to any to access ternary fields easily or use ConditionalExpression type
        return `(${this.generate(ce.test)} ? ${this.generate(ce.consequent)} : ${this.generate(ce.alternate)})`;
      }

      default:
        return '';
    }
  }
}
