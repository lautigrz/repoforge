import type {
    Detector,
    ProjectContext,
    ProjectModel,
    Technology
} from "@repoforge/shared";
import { PackageJsonReader } from "../ecosystems/node/index.js";


export class NodeRuntimeDetector implements Detector {

    readonly name = "node-runtime";


    constructor(
        private readonly packageJsonReader: PackageJsonReader
    ) { }


    async detect(
        context: ProjectContext,
        model: ProjectModel
    ): Promise<void> {


        const packageJson =
            await this.packageJsonReader.read(context);


        if (!packageJson) {
            return;
        }


        const exists = model.technologies.some(
            tech => tech.name === "Node.js"
        );


        if (exists) {
            return;
        }


        let version: string | undefined;

        const evidence: string[] = [];


        // 1. package.json -> engines.node
        if (packageJson.engines?.node) {
            version = packageJson.engines.node;
            evidence.push("version from package.json engines.node");
        }

        // 2. .nvmrc
        if (!version && context.fileExists(".nvmrc")) {
            const content = await context.readFile(".nvmrc");
            if (content) {
                version = content.trim();
                evidence.push("version from .nvmrc");
            }
        }

        // 3. .node-version
        if (!version && context.fileExists(".node-version")) {
            const content = await context.readFile(".node-version");
            if (content) {
                version = content.trim();
                evidence.push("version from .node-version");
            }
        }

        // 4. volta
        if (!version && packageJson.volta?.node) {
            version = packageJson.volta.node;
            evidence.push("version from package.json volta.node");
        }

        // 5. default -> lts
        if (!version) {
            version = "lts";
            evidence.push("default lts runtime fallback");
        }


        if (!evidence.length) {

            evidence.push(
                "package.json detected"
            );

        }


        const technology: Technology = {
            name: "Node.js",
            category: "runtime",
            confidence: 1,
            evidence
        };


        if (version) {

            technology.metadata = {
                version
            };

        }


        model.technologies.push(
            technology
        );


        model.runtime = {
            name: "Node.js",
            ...(version && { version })
        };

    }

}