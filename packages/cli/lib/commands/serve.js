import express from 'express';
import path from 'path';
import chalk from 'chalk';
import fs from 'fs-extra';
export async function serveCommand(dir, options) {
    const port = parseInt(options.port || '3000');
    const app = express();
    const serveDir = path.resolve(process.cwd(), dir || '.');
    console.log(chalk.cyan(`Starting Web+ Dev Server...`));
    console.log(chalk.gray(`Serving directory: ${serveDir}`));
    // Add COOP/COEP headers for SharedArrayBuffer support (needed for workers)
    app.use((req, res, next) => {
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        next();
    });
    // Serve static files
    app.use(express.static(serveDir));
    // Fallback for SPA routing if needed (though Web+ apps are usually single page)
    app.get('*', (req, res) => {
        const indexHtml = path.join(serveDir, 'index.html');
        if (fs.existsSync(indexHtml)) {
            res.sendFile(indexHtml);
        }
        else {
            res.status(404).send('Not found');
        }
    });
    app.listen(port, () => {
        console.log(chalk.green(`✔ Server ready at http://localhost:${port}`));
        console.log(chalk.gray(`Press Ctrl+C to stop`));
    });
}
//# sourceMappingURL=serve.js.map