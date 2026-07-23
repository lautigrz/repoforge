import type { ProjectModel, Runner } from "@repoforge/shared";
import { DockerComposeGenerator, DockerIgnoreGenerator } from "@repoforge/generators";
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
        const hasServices = Boolean(model?.services && model.services.length > 0);

        if (hasServices && model) {
            console.log(`\n📦 Infrastructure services detected: ${model.services!.map(s => s.name).join(", ")}.`);
            console.log(`🛠️ Generating and writing docker-compose.yml...`);
            const composeGen = new DockerComposeGenerator();
            const composeContent = composeGen.generate(model);
            await this.writeDockerCompose(projectPath, composeContent);

            console.log(`\n🚀 Launching entire environment with Docker Compose...`);
            const composeFilePath = `${dockerPath}/docker-compose.yml`;

            try {
                await runDockerCommandWithCapturedOutput([
                    "docker", "compose",
                    "-f", composeFilePath,
                    "up", "-d", "--build", "--remove-orphans"
                ]);
            } catch (err: any) {
                const rawOutput = err.message || "";
                const diag = this.errorAnalyzer.analyze(rawOutput);
                console.error(this.errorAnalyzer.formatDiagnostic(diag));
                throw err;
            }
        } else {
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

            const containerName = imageName;
            console.log(`\n🧹 Cleaning up any previous container "${containerName}"...`);
            try {
                await runDockerCommandWithCapturedOutput([
                    "docker", "rm", "-f", containerName
                ]);
            } catch {
                // Ignore if container does not exist
            }

            console.log(`\n🚀 Running container on port ${port}...`);

            try {
                await runDockerCommandWithCapturedOutput([
                    "docker", "run",
                    "-d",
                    "--name", containerName,
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

    async writeDockerCompose(
        projectPath: string,
        content: string
    ): Promise<void> {
        const composePath = path.join(projectPath, "docker-compose.yml");
        await writeFile(composePath, content, "utf-8");
        console.log(`\n📄 docker-compose.yml written to ${composePath}`);
    }
}