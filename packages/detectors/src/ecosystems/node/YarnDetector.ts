import type { Detector, ProjectContext, ProjectModel } from "@repoforge/shared";
import { PackageJsonReader } from "./readers/PackageJsonReader.js";

export class YarnDetector implements Detector {
    readonly name = "yarn";

    constructor(private readonly packageJsonReader?: PackageJsonReader) {}

    async detect(
        context: ProjectContext,
        model: ProjectModel
    ): Promise<void> {
        const hasLockFile = context.fileExists("yarn.lock");
        const packageJson = this.packageJsonReader ? await this.packageJsonReader.read(context) : null;
        const pmField = packageJson?.packageManager;

        let version: string | undefined;
        let useCorepack = false;

        if (pmField && pmField.startsWith("yarn")) {
            const parts = pmField.split("@");
            if (parts.length > 1) {
                version = parts[1];
                useCorepack = true;
            }
        }

        if (!hasLockFile && !version && !pmField?.startsWith("yarn")) {
            return;
        }

        model.packageManagers.push({
            name: "yarn",
            ecosystem: "node",
            lockFile: hasLockFile ? "yarn.lock" : undefined,
            version: version ?? "1.22.22",
            useCorepack: useCorepack || Boolean(version),
            packageManagerField: pmField
        });
    }
}
