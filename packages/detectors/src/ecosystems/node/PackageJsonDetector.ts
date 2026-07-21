import type {
    Detector,
    ProjectContext,
    ProjectModel
} from "@repoforge/shared";


export class PackageJsonDetector implements Detector {

    readonly name = "package-json";


    async detect(
        context: ProjectContext,
        model: ProjectModel
    ): Promise<void> {


        if (!context.fileExists("package.json")) {
            return;
        }
        const content = await context.readFile(
            "package.json"
        );


        if (!content) {
            return;
        }


        const packageJson = JSON.parse(content);


        model.scripts = packageJson.scripts ?? {};


        model.dependencies.production = packageJson.dependencies ?? {}


        model.dependencies.development = packageJson.devDependencies ?? {}

    }
}