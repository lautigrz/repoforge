import type {
    Detector,
    ProjectContext,
    ProjectModel
} from "@repoforge/shared";


export class NodeRuntimeDetector implements Detector {

    readonly name = "node-runtime";


    async detect(
        context: ProjectContext,
        model: ProjectModel
    ): Promise<void> {


        if (!context.fileExists("package.json")) {
            return;
        }

        const exists = model.technologies.some(
            tech => tech.name === "Node.js"
        );


        if (exists) {
            return;
        }


        model.technologies.push({
            name: "Node.js",
            category: "runtime",
            confidence: 1,
            evidence: [
                "package.json found"
            ]
        });

    }

}