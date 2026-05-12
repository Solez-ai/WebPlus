#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { buildCommand } from './commands/build.js';
import { runCommand } from './commands/run.js';
import { serveCommand } from './commands/serve.js';
import { formatCommand } from './commands/format.js';
import { lintCommand } from './commands/lint.js';
import { testCommand } from './commands/test.js';
import { packageCommand } from './commands/package.js';
import { createCommand } from './commands/create.js';

const program = new Command();

console.log(chalk.cyan.bold('Web+') + chalk.gray(' v0.2.0'));

program
    .name('webplus')
    .description('Web+ compiler and toolchain')
    .version('0.1.0');

program
    .command('create')
    .description('Create new Web+ project')
    .argument('<name>', 'Project name')
    .action(createCommand);

program
    .command('build')
    .description('Compile Web+ source to WebAssembly')
    .argument('<source>', 'Source file or directory')
    .option('-o, --output <path>', 'Output directory', './build')
    .option('-f, --format <format>', 'Output format: wasm, wat, or cpp', 'wasm')
    .option('--optimize', 'Enable optimizations', false)
    .option('--debug', 'Generate debug info', false)
    .option('--check', 'Check only (no build)', false)
    .option('--emit-json', 'Emit compilation result as JSON', false)
    .action(buildCommand);

program
    .command('run')
    .description('Execute Web+ application')
    .argument('<target>', 'Output directory or source file')
    .action(runCommand);

program
    .command('serve')
    .description('Start development server with hot-reload')
    .argument('[source]', 'Source directory', './src')
    .option('-p, --port <port>', 'Server port', '3000')
    .option('--open', 'Open in browser', false)
    .action(serveCommand);

program
    .command('format')
    .description('Format Web+ source code')
    .argument('<files...>', 'Files to format')
    .option('--check', 'Check formatting without modifying', false)
    .action(formatCommand);

program
    .command('lint')
    .description('Lint Web+ source code')
    .argument('<files...>', 'Files to lint')
    .option('--fix', 'Automatically fix issues', false)
    .action(lintCommand);

program
    .command('test')
    .description('Run tests')
    .argument('[pattern]', 'Test file pattern', '**/*.test.webplus')
    .option('--watch', 'Watch mode', false)
    .action(testCommand);

program
    .command('package')
    .description('Create distributable package')
    .argument('<directory>', 'Project directory')
    .option('-o, --output <path>', 'Output file', './package.wasm')
    .action(packageCommand);

program.parse();
