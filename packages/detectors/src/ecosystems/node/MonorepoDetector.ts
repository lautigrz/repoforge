import type { Detector, ProjectContext, ProjectModel } from "@repoforge/shared";
import { PackageJsonReader } from "./readers/PackageJsonReader.js";

export class MonorepoDetector implements Detector {
    readonly name = "monorepo";

    constructor(private readonly packageJsonReader: PackageJsonReader) {}

    async detect(
        context: ProjectContext,
        model: ProjectModel
    ): Promise<void> {
        let isMonorepo = false;
        let tool: "pnpm" | "npm" | "yarn" | "turbo" | "lerna" | undefined;
        let workspaceFile: string | undefined;

        if (context.fileExists("pnpm-workspace.yaml")) {
            isMonorepo = true;
            tool = "pnpm";
            workspaceFile = "pnpm-workspace.yaml";
        } else if (context.fileExists("lerna.json")) {
            isMonorepo = true;
            tool = "lerna";
            workspaceFile = "lerna.json";
        } else if (context.fileExists("turbo.json")) {
            isMonorepo = true;
            tool = "turbo";
            workspaceFile = "turbo.json";
        }

        const packageJson = await this.packageJsonReader.read(context);
        if (packageJson?.workspaces) {
            isMonorepo = true;
            if (!tool) {
                tool = "npm";
            }
        }

        if (isMonorepo) {
            model.monorepo = {
                isMonorepo: true,
                tool,
                workspaceFile
            };
        }
    }
}
