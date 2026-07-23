#!/usr/bin/env node
import { Analyzer, FileScanner } from "@repoforge/core";
import { BootstrapEngine } from "@repoforge/core";
import {
    NodeRuntimeDetector,
    DetectorRegistry,
    NodeEcosystemProvider,
    PackageJsonReader
} from "@repoforge/detectors";
import { DockerfileGenerator, DockerIgnoreGenerator } from "@repoforge/generators";
import { DockerRunner, ReportGenerator } from "@repoforge/runner";
import path from "node:path";
import process from "node:process";

async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || "run";

    const isCompat = args.includes("--compat");
    const useExisting = args.includes("--use-existing");
    const useCorepack = args.includes("--use-corepack");
    const noMultiStage = args.includes("--no-multistage");

    let targetPath = process.cwd();
    for (let i = 1; i < args.length; i++) {
        if (!args[i].startsWith("-")) {
            targetPath = path.resolve(args[i]);
            break;
        }
    }

    console.log(`\n🔍 Analyzing project at: ${targetPath}`);
    if (isCompat) {
        console.log(`⚡ Running in COMPATIBILITY mode (--compat active)`);
    }

    const packageJsonReader = new PackageJsonReader();
    const analyzer = new Analyzer(
        new FileScanner(),
        new BootstrapEngine([new NodeRuntimeDetector(packageJsonReader)]),
        new DetectorRegistry([new NodeEcosystemProvider(packageJsonReader)])
    );

    const model = await analyzer.analyze(targetPath, {
        compat: isCompat,
        multiStage: !noMultiStage,
        useCorepack
    });

    if (command === "analyze") {
        console.log("\n📊 Project Model Analysis:");
        console.dir(model, { depth: null });
        const reportGen = new ReportGenerator();
        const report = reportGen.createReport(model, true);
        console.log(reportGen.formatReport(report));
        return;
    }

    const runner = new DockerRunner();

    if (useExisting && model.docker?.hasDockerfile) {
        console.log(`\n🐳 Existing Dockerfile detected (${model.docker.dockerfilePath}). Using existing setup.`);
    } else {
        const generator = new DockerfileGenerator();
        const dockerfileContent = generator.generate(model);
        await runner.writeDockerfile(targetPath, dockerfileContent);
    }

    const port = model.server?.port ?? 3000;
    const imageName = `repoforge-${path.basename(targetPath).toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

    await runner.run(targetPath, imageName, port, model);
}

main().catch(err => {
    console.error(`\n❌ Error executing RepoForge CLI:`, err.message);
    process.exit(1);
});
