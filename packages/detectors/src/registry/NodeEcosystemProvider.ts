import type {
    EcosystemProvider
} from "./EcosystemProvider.js";


import type {
    Detector,
    ProjectModel
} from "@repoforge/shared";


import {
    NpmDetector,
    PackageJsonDetector,
    PnpmDetector,
    TypeScriptDetector,
} from "../ecosystems/node/index.js";


export class NodeEcosystemProvider implements EcosystemProvider {


    matches(model: ProjectModel): boolean {

        return model.technologies.some(
            tech => tech.name === "Node.js"
        );

    }


    detectors(): Detector[] {

        return [
            new PackageJsonDetector(),
            new PnpmDetector(),
            new NpmDetector(),
            new TypeScriptDetector()
        ];

    }

}