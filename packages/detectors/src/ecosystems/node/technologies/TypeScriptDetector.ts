import type {
    Detector,
    ProjectContext,
    ProjectModel
} from "@repoforge/shared";
import { PackageJsonReader } from "../readers/PackageJsonReader.js";


export class TypeScriptDetector implements Detector {

    readonly name = "typescript";

    constructor(private readonly packageJsonReader: PackageJsonReader) {
    }

    async detect(
        context: ProjectContext,
        model: ProjectModel
    ): Promise<void> {


        if (!context.fileExists("tsconfig.json")) {
            return;
        }


        const dependencies = await this.packageJsonReader.getDependencies(context);


        model.technologies.push({
            name: "TypeScript",
            category: "language",
            confidence: 1,
            evidence: [
                "file: tsconfig.json"
            ],
            metadata: {
                version: dependencies["typescript"]
            }
        });

    }

}