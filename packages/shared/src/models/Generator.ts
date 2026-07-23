import type { ProjectModel } from "./ProjectModel.js";

export interface Generator<T> {

    generate(
        model: ProjectModel
    ): T;

}