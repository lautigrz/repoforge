import type { ProjectModel, Runner } from "@repoforge/shared";
import { DockerIgnoreGenerator } from "@repoforge/generators";
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { DockerErrorAnalyzer } from "./DockerErrorAnalyzer.js";
import { ReportGenerator } from "./ReportGenerator.js";

const isWindows = process.platform === "win32";

function toDockerPath(projectPath: string): string {
    if (!isWindows) {
        return projectPath;
    }
    return projectPath
        .replace(/^([A-Za-z]):/, (_, drive) => `/mnt/${drive.toLowerCase()}`)
        .replace(/\\/g, "/");
}

function runDockerCommandWithCapturedOutput(args: string[]): Promise<string> {
    const [cmd, cmdArgs] = isWindows
        ? ["wsl", args]
        : [args[0], args.slice(1)];

    return new Promise((resolve, reject) => {
        let output = "";
        const child = spawn(cmd, cmdArgs);

        child.stdout?.on("data", data => {
            const str = data.toString();
            process.stdout.write(str);
            output += str;
        });

        child.stderr?.on("data", data => {
            const str = data.toString();
            process.stderr.write(str);
            output += str;
        });

        child.on("close", code => {
            if (code === 0) {
                resolve(output);
            } else {
                reject(new Error(output || `Command failed with exit code ${code}`));
            }
        });

        child.on("error", err => reject(err));
    });
}

export class DockerRunner implements Runner {
    private readonly errorAnalyzer = new DockerErrorAnalyzer();
    private readonly reportGenerator = new ReportGenerator();

    async run(
        projectPath: string,
        imageName: string,
        port: number,
        model?: ProjectModel
    ): Promise<string> {
        const dockerPath = toDockerPath(projectPath);
        const startTime = Date.now();

        console.log(`\n🔨 Building Docker image "${imageName}"...`);

        try {
            await runDockerCommandWithCapturedOutput([
                "docker", "build",
                "-t", imageName,
                dockerPath
            ]);
        } catch (err: any) {
            const rawOutput = err.message || "";
            const diag = this.errorAnalyzer.analyze(rawOutput);
            console.error(this.errorAnalyzer.formatDiagnostic(diag));
            throw err;
        }

        console.log(`\n🚀 Running container on port ${port}...`);

        try {
            await runDockerCommandWithCapturedOutput([
                "docker", "run",
                "-d",
                "-p", `${port}:${port}`,
                "-e", `PORT=${port}`,
                imageName
            ]);
        } catch (err: any) {
            const rawOutput = err.message || "";
            const diag = this.errorAnalyzer.analyze(rawOutput);
            console.error(this.errorAnalyzer.formatDiagnostic(diag));
            throw err;
        }

        const url = `http://localhost:${port}`;
        const elapsedTime = (Date.now() - startTime) / 1000;

        if (model) {
            const report = this.reportGenerator.createReport(model, true, {
                imageName,
                startupTimeSeconds: elapsedTime,
                url
            });
            console.log(this.reportGenerator.formatReport(report));
        }

        return url;
    }

    async writeDockerfile(
        projectPath: string,
        content: string
    ): Promise<void> {
        const dockerfilePath = path.join(projectPath, "Dockerfile");
        const dockerignorePath = path.join(projectPath, ".dockerignore");

        const ignoreGen = new DockerIgnoreGenerator();
        const dockerignoreContent = ignoreGen.generate();

        await writeFile(dockerfilePath, content, "utf-8");
        await writeFile(dockerignorePath, dockerignoreContent, "utf-8");

        console.log(`\n📄 Dockerfile written to ${dockerfilePath}`);
        console.log(`📄 .dockerignore written to ${dockerignorePath}`);
    }
}