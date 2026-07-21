import type { Detector, ProjectContext, ProjectModel } from "@repoforge/shared";


export class NpmDetector implements Detector {

    readonly name = "npm";

    async detect(
        context: ProjectContext,
        model: ProjectModel
    ): Promise<void> {

        if (!context.fileExists("package-lock.json")) {
            return;
        }

        model.packageManagers.push({
            name: "npm",
            ecosystem: "node",
            lockFile: "package-lock.json"
        });

    }

}