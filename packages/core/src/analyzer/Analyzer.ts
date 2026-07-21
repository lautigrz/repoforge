import type { ProjectModel } from "@repoforge/shared";
import { FileScanner } from "../scanner/FileScanner.js";
import { DetectorEngine } from "../detector/DetectorEngine.js";
import { BootstrapEngine } from "../engines/DetectorEngine.js";
import { DetectorRegistry } from "@repoforge/detectors";

export class Analyzer {
    constructor(
        private readonly scanner: FileScanner,
        private readonly bootsTrapEngine: BootstrapEngine,
        private readonly registry: DetectorRegistry
    ) { }

    async analyze(
        path: string
    ): Promise<ProjectModel> {

        const context = await this.scanner.scan(path);
        const model: ProjectModel = {
            technologies: [],
            packageManagers: [],
            scripts: {},
            commands: {},
            dependencies: { production: {}, development: {} }
        };

        await this.bootsTrapEngine.run(context, model);

        const detectors = this.registry.getDetectors(model);

        const engine =
            new DetectorEngine(detectors);

        await engine.run(
            context,
            model
        );

        return model;
    }

}