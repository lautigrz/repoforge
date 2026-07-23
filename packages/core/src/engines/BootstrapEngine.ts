import type {
    Detector,
    ProjectContext,
    ProjectModel
} from "@repoforge/shared";


export class BootstrapEngine {

    constructor(
        private readonly detectors: Detector[]
    ) { }


    async run(
        context: ProjectContext,
        model: ProjectModel
    ): Promise<void> {

        for (const detector of this.detectors) {
            await detector.detect(context, model);
        }

    }

}
