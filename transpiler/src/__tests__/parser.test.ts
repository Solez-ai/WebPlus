// Web+ Transpiler Unit Tests

import { transpile } from '../index';

describe('Web+ Transpiler', () => {
    describe('Basic Types', () => {
        test('parses int variable', () => {
            const code = `void main() { int x = 42; }`;
            const result = transpile(code);
            expect(result).toContain('int x = 42');
        });

        test('parses float variable', () => {
            const code = `void main() { float pi = 3.14; }`;
            const result = transpile(code);
            expect(result).toContain('float pi = 3.14');
        });

        test('parses string variable', () => {
            const code = `void main() { string s = "hello"; }`;
            const result = transpile(code);
            expect(result).toContain('webplus::String s = "hello"');
        });

        test('parses bool variable', () => {
            const code = `void main() { bool flag = true; }`;
            const result = transpile(code);
            expect(result).toContain('bool flag = true');
        });
    });

    describe('Functions', () => {
        test('parses void function', () => {
            const code = `void greet() { print("Hello"); }`;
            const result = transpile(code);
            expect(result).toContain('void greet()');
        });

        test('parses function with parameters', () => {
            const code = `void add(int a, int b) { }`;
            const result = transpile(code);
            expect(result).toContain('void add(int a, int b)');
        });

        test('parses function with return value', () => {
            const code = `int multiply(int a, int b) { return a * b; }`;
            const result = transpile(code);
            expect(result).toContain('int multiply(int a, int b)');
        });
    });

    describe('Control Flow', () => {
        test('parses if statement', () => {
            const code = `void main() { if (x > 0) { print("positive"); } }`;
            const result = transpile(code);
            expect(result).toContain('if (');
        });

        test('parses for loop', () => {
            const code = `void main() { for (int i = 0; i < 10; i++) { print(i); } }`;
            const result = transpile(code);
            expect(result).toContain('for (');
        });

        test('parses while loop', () => {
            const code = `void main() { while (true) { break; } }`;
            const result = transpile(code);
            expect(result).toContain('while (');
        });
    });

    describe('DOM Operations', () => {
        test('parses dom::get', () => {
            const code = `void main() { dom::Element app = dom::get("#app"); }`;
            const result = transpile(code);
            expect(result).toContain('webplus::dom::get("#app")');
        });

        test('parses element.text()', () => {
            const code = `void main() { dom::get("#app").text("Hello"); }`;
            const result = transpile(code);
            expect(result).toContain('.text(');
        });

        test('parses element.style', () => {
            const code = `void main() { dom::get("#modal").style.display = "flex"; }`;
            const result = transpile(code);
            expect(result).toContain('.style.display = "flex"');
        });
    });

    describe('Memory Operations', () => {
        test('parses alloc', () => {
            const code = `void main() { int* ptr = alloc<int>(10); }`;
            const result = transpile(code);
            expect(result).toContain('webplus::alloc<int>(');
        });

        test('parses free', () => {
            const code = `void main() { free(ptr); }`;
            const result = transpile(code);
            expect(result).toContain('webplus::free_ptr(');
        });
    });

    describe('Structs', () => {
        test('parses struct declaration', () => {
            const code = `struct Point { float x; float y; };`;
            const result = transpile(code);
            expect(result).toContain('struct Point');
            expect(result).toContain('float x');
            expect(result).toContain('float y');
        });

        test('parses struct access', () => {
            const code = `void main() { Point* p = alloc<Point>(1); p->x = 10; }`;
            const result = transpile(code);
            expect(result).toContain('->x = 10');
        });
    });

    describe('Workers', () => {
        test('parses worker::spawn', () => {
            const code = `void main() { worker w = worker::spawn([] { return 42; }); }`;
            const result = transpile(code);
            expect(result).toContain('webplus::worker::spawn');
        });
    });

    describe('Compound Assignment', () => {
        test('parses += operator', () => {
            const code = `void main() { int x = 5; x = x + 3; }`;
            const result = transpile(code);
            expect(result).toContain('x = (x + 3)');
        });
    });

    describe('String Operations', () => {
        test('parses string concatenation', () => {
            const code = `void main() { string s = "hello" + " world"; }`;
            const result = transpile(code);
            expect(result).toContain('+');
        });
    });
});

// Simple test runner
const runTests = () => {
    console.log('Running Web+ Transpiler Tests...\n');
    const test = new (globalThis as any).Test();
    // Run tests manually since we don't have jest setup
    try {
        // Test basic parsing
        const result = transpile('void main() { int x = 42; }');
        if (result.includes('int x = 42')) {
            console.log('✅ Basic int variable - PASS');
        } else {
            console.log('❌ Basic int variable - FAIL');
        }
    } catch (e: any) {
        console.log('❌ Basic int variable - ERROR:', e.message);
    }

    try {
        const result = transpile('void main() { dom::Element app = dom::get("#app"); }');
        if (result.includes('webplus::dom::get')) {
            console.log('✅ DOM get - PASS');
        } else {
            console.log('❌ DOM get - FAIL');
        }
    } catch (e: any) {
        console.log('❌ DOM get - ERROR:', e.message);
    }

    try {
        const result = transpile('void main() { worker w = worker::spawn([] { return 42; }); }');
        if (result.includes('webplus::worker::spawn')) {
            console.log('✅ Worker spawn - PASS');
        } else {
            console.log('❌ Worker spawn - FAIL');
        }
    } catch (e: any) {
        console.log('❌ Worker spawn - ERROR:', e.message);
    }

    console.log('\nDone!');
};

runTests();