import type {
    Detector,
    ProjectContext,
    ProjectModel
} from "@repoforge/shared";


export class CommandDetector implements Detector {
    readonly name = "commands";

    async detect(
        context: ProjectContext,
        model: ProjectModel
    ): Promise<void> {
        const scripts = model.scripts;

        // Dev script priority
        const devCandidates = ["dev", "start:dev", "serve:dev"];
        const devScript = devCandidates.find(s => scripts[s]);
        if (devScript) {
            model.commands.development = {
                script: devScript,
                command: scripts[devScript]
            };
        }

        // Build script priority
        const buildCandidates = ["build", "compile", "build:prod"];
        const buildScript = buildCandidates.find(s => scripts[s]);
        if (buildScript) {
            model.commands.build = {
                script: buildScript,
                command: scripts[buildScript]
            };
        }

        // Production script priority
        const prodCandidates = ["start:prod", "prod", "start", "serve", "preview"];
        const prodScript = prodCandidates.find(s => scripts[s]);
        if (prodScript) {
            model.commands.production = {
                script: prodScript,
                command: scripts[prodScript]
            };
        } else {
            // Fallback entrypoints
            const entryPoints = ["dist/main.js", "dist/index.js", "src/index.ts", "index.js", "server.js", "app.js"];
            for (const entry of entryPoints) {
                if (context.fileExists(entry)) {
                    model.commands.production = {
                        script: "node-entry",
                        command: entry.endsWith(".ts") ? `tsx ${entry}` : `node ${entry}`
                    };
                    break;
                }
            }
        }

        // Test script
        if (scripts.test) {
            model.commands.test = {
                script: "test",
                command: scripts.test
            };
        }
    }
}