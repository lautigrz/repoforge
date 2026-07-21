import type { ProjectContext } from "../models/ProjectContext.js";


export interface Scanner {

    scan(
        path: string
    ): Promise<ProjectContext>;

}