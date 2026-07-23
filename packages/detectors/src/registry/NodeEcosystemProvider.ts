import type { EcosystemProvider } from "./EcosystemProvider.js";
import type { Detector, ProjectModel } from "@repoforge/shared";
import {
    NpmDetector,
    PackageJsonDetector,
    PnpmDetector,
    YarnDetector,
    TypeScriptDetector,
    CommandDetector,
    PortDetector,
    MonorepoDetector,
    DockerExistingDetector
} from "../ecosystems/node/index.js";
import { ExpressDetector } from "../ecosystems/node/frameworks/ExpressDetector.js";
import { OrmDetector } from "../ecosystems/node/technologies/OrmDetector.js";
import { PrismaDetector } from "../ecosystems/node/technologies/PrismaDetector.js";
import { PackageJsonReader } from "../ecosystems/node/readers/PackageJsonReader.js";

export class NodeEcosystemProvider implements EcosystemProvider {
    constructor(private packageJsonReader: PackageJsonReader) {}

    matches(model: ProjectModel): boolean {
        return model.technologies.some(
            tech => tech.name === "Node.js"
        );
    }

    detectors(): Detector[] {
        return [
            new PackageJsonDetector(this.packageJsonReader),
            new PnpmDetector(this.packageJsonReader),
            new NpmDetector(this.packageJsonReader),
            new YarnDetector(this.packageJsonReader),
            new TypeScriptDetector(this.packageJsonReader),
            new ExpressDetector(this.packageJsonReader),
            new OrmDetector(this.packageJsonReader),
            new PrismaDetector(this.packageJsonReader),
            new MonorepoDetector(this.packageJsonReader),
            new DockerExistingDetector(),
            new CommandDetector(),
            new PortDetector()
        ];
    }
}