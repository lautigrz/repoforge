import type {
    Detector,
    ProjectModel
} from "@repoforge/shared";


import type {
    EcosystemProvider
} from "./EcosystemProvider.js";


export class DetectorRegistry {


    constructor(
        private readonly providers: EcosystemProvider[]
    ) { }


    getDetectors(
        model: ProjectModel
    ): Detector[] {

        return this.providers
            .filter(provider => provider.matches(model))
            .flatMap(provider => provider.detectors());

    }

}