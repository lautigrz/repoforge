import { DockerRunner } from "@repoforge/runner";
import { BootstrapEngine } from "./engines/BootstrapEngine.js";
import { Analyzer, FileScanner } from "./index.js";
import {
    NodeRuntimeDetector,
    DetectorRegistry,
    NodeEcosystemProvider,
    PackageJsonReader
} from "@repoforge/detectors";
import { DockerfileGenerator } from "@repoforge/generators";
import path from "node:path";
import process from "node:process";

async function runTest() {
    const args = process.argv.slice(2);
    const isCompat = args.includes("--compat");
    const noMultiStage = args.includes("--no-multistage");

    const isWindows = process.platform === "win32";
    const defaultPath = isWindows
        ? "C:/Users/Lautaro Gerez/Desktop/prueba"
        : "/mnt/c/Users/Lautaro Gerez/Desktop/prueba";

    let projectPath = defaultPath;
    for (const arg of args) {
        if (!arg.startsWith("-")) {
            projectPath = path.resolve(arg);
            break;
        }
    }

    console.log(`\n🚀 Starting RepoForge Test Execution`);
    console.log(`📂 Scanning Project Path: ${projectPath}`);
    if (isCompat) {
        console.log(`⚡ Mode: COMPATIBILITY (--compat active)`);
    }

    const packageJsonReader = new PackageJsonReader();
    const analyzer = new Analyzer(
        new FileScanner(),
        new BootstrapEngine([new NodeRuntimeDetector(packageJsonReader)]),
        new DetectorRegistry([new NodeEcosystemProvider(packageJsonReader)])
    );

    const model = await analyzer.analyze(projectPath, {
        compat: isCompat,
        multiStage: !noMultiStage
    });

    console.log("\n📊 Analysis Model Output:");
    console.dir(model, { depth: null });

    const generator = new DockerfileGenerator();
    const dockerFile = generator.generate(model);

    console.log("\n=== Generated Dockerfile ===");
    console.log(dockerFile);

    const runner = new DockerRunner();

    console.log("\n📄 Writing Dockerfile & .dockerignore...");
    await runner.writeDockerfile(projectPath, dockerFile);

    const imageName = `repoforge-app-${path.basename(projectPath).toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
    const port = model.server?.port ?? 3000;

    console.log(`\n🐳 Building & Launching Container "${imageName}" on Port ${port}...`);
    const url = await runner.run(projectPath, imageName, port, model);

    console.log(`\n✅ Container successfully launched and running at: ${url}`);
}

runTest().catch(err => {
    console.error("\n❌ Test Execution Failed:", err);
    process.exit(1);
});