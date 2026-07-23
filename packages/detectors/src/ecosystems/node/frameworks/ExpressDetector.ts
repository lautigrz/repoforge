import type { Detector, ProjectContext, ProjectModel } from "@repoforge/shared";
import { PackageJsonReader } from "../readers/PackageJsonReader.js";


export class ExpressDetector implements Detector {

    readonly name = "express";

    constructor(private readonly packageJsonReader: PackageJsonReader) {
    }
    async detect(
        context: ProjectContext,
        model: ProjectModel
    ): Promise<void> {
        const packageJson = await this.packageJsonReader.read(context);
        if (!packageJson) {
            return;
        }
        const dependencies = await this.packageJsonReader.getDependencies(context);

        if ("express" in dependencies) {
            model.technologies.push({
                name: "Express",
                category: "framework",
                confidence: 1,
                evidence: [
                    "dependency: express"
                ],
                metadata: {
                    version: dependencies["express"]
                }
            });
        }
    }

}