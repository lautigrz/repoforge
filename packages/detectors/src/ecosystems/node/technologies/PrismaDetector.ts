import type { Detector, ProjectContext, ProjectModel } from "@repoforge/shared";
import { PackageJsonReader } from "../readers/PackageJsonReader.js";

export class PrismaDetector implements Detector {
    readonly name = "prisma";

    constructor(private readonly packageJsonReader: PackageJsonReader) {}

    async detect(
        context: ProjectContext,
        model: ProjectModel
    ): Promise<void> {
        const deps = await this.packageJsonReader.getDependencies(context);
        const hasPrismaDep = Boolean(deps["prisma"] || deps["@prisma/client"]);

        let schemaPath: string | undefined;
        if (context.fileExists("prisma/schema.prisma")) {
            schemaPath = "prisma/schema.prisma";
        } else if (context.fileExists("schema.prisma")) {
            schemaPath = "schema.prisma";
        }

        if (hasPrismaDep || schemaPath) {
            model.orm = {
                name: "Prisma",
                schemaPath,
                hasSchema: Boolean(schemaPath)
            };
            model.prisma = {
                hasPrisma: true,
                schemaPath
            };

            const exists = model.technologies.some(t => t.name === "Prisma");
            if (!exists) {
                model.technologies.push({
                    name: "Prisma",
                    category: "orm",
                    confidence: 1,
                    evidence: [
                        hasPrismaDep ? "dependency: prisma" : "schema file detected"
                    ],
                    metadata: {
                        schemaPath,
                        version: deps["prisma"] || deps["@prisma/client"]
                    }
                });
            }
        }
    }
}
