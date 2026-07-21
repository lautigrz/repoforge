import type {
    Detector,
    ProjectContext,
    ProjectModel
} from "@repoforge/shared";


export class TypeScriptDetector implements Detector {

    readonly name = "typescript";


    async detect(
        context: ProjectContext,
        model: ProjectModel
    ): Promise<void> {


        if (!context.fileExists("tsconfig.json")) {
            return;
        }


        model.technologies.push({
            name: "TypeScript",
            category: "language",
            confidence: 1,
            evidence: [
                "tsconfig.json found"
            ]
        });

    }

}