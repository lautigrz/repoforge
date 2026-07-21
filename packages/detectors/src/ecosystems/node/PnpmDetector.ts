import type { Detector, ProjectContext, ProjectModel } from "@repoforge/shared";


export class PnpmDetector implements Detector {

    readonly name = "pnpm";


    async detect(
        context: ProjectContext,
        model: ProjectModel
    ): Promise<void> {

        if (!context.fileExists("pnpm-lock.yaml")) {
            return;
        }

        model.packageManagers.push({
            name: "pnpm",
            ecosystem: "node",
            lockFile: "pnpm-lock.yaml"
        });

    }

}