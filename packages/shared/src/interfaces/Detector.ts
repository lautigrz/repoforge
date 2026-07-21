import type { ProjectContext } from "../models/ProjectContext.js";
import type { ProjectModel } from "../models/ProjectModel.js";


export interface Detector {

    name: string;


    detect(
        context: ProjectContext,
        model: ProjectModel
    ): Promise<void>;

}