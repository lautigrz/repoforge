import type { Detector, ProjectContext, ProjectModel } from "@repoforge/shared";

export class TestDetector implements Detector {

    readonly name = "test";

    async detect(
        _: ProjectContext,
        model: ProjectModel
    ) {
        model.technologies.push({
            name: "Test",
            category: "tool",
            confidence: 1,
            evidence: []
        });
    }

}