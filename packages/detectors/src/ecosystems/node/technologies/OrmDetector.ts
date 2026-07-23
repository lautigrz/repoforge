import type { Detector, ProjectContext, ProjectModel } from "@repoforge/shared";
import { PackageJsonReader } from "../readers/PackageJsonReader.js";



const ORMS: Record<string, string> = {
    "mongoose": "Mongoose",
    "sequelize": "Sequelize",
    "prisma": "Prisma",
    "typeorm": "Typeorm",
}


export class OrmDetector implements Detector {

    readonly name = "orm";
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

        for (const orm of Object.keys(ORMS)) {
            if (dependencies[orm]) {
                model.technologies.push({
                    name: ORMS[orm],
                    category: "orm",
                    confidence: 1,
                    evidence: [
                        `dependency: ${orm}`
                    ],
                    metadata: {
                        version: dependencies[orm]
                    }
                });
            }
        }
    }

}