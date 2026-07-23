import type {
    Detector,
    ProjectContext,
    ProjectModel
} from "@repoforge/shared";
import { PackageJsonReader } from "./readers/PackageJsonReader.js";


export class PackageJsonDetector implements Detector {

    readonly name = "package-json";

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

        model.scripts =
            await this.packageJsonReader.getScripts(context);

        model.dependencies.production =
            packageJson.dependencies ?? {};

        model.dependencies.development =
            packageJson.devDependencies ?? {};

    }
}