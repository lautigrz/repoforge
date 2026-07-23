import type { Detector, ProjectContext, ProjectModel } from "@repoforge/shared";
import { PackageJsonReader } from "./readers/PackageJsonReader.js";

export class NpmDetector implements Detector {
    readonly name = "npm";

    constructor(private readonly packageJsonReader?: PackageJsonReader) {}

    async detect(
        context: ProjectContext,
        model: ProjectModel
    ): Promise<void> {
        const hasLockFile = context.fileExists("package-lock.json");
        const packageJson = this.packageJsonReader ? await this.packageJsonReader.read(context) : null;
        const pmField = packageJson?.packageManager;

        let version: string | undefined;
        let useCorepack = false;

        if (pmField && pmField.startsWith("npm")) {
            const parts = pmField.split("@");
            if (parts.length > 1) {
                version = parts[1];
                useCorepack = true;
            }
        }

        if (!hasLockFile && !version && !pmField?.startsWith("npm") && model.packageManagers.length > 0) {
            return;
        }

        model.packageManagers.push({
            name: "npm",
            ecosystem: "node",
            lockFile: hasLockFile ? "package-lock.json" : undefined,
            version,
            useCorepack,
            packageManagerField: pmField
        });
    }
}