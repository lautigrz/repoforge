import type {
    Detector,
    ProjectModel
} from "@repoforge/shared";


export interface EcosystemProvider {

    matches(model: ProjectModel): boolean;

    detectors(): Detector[];

}