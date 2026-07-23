import type { ProjectModel } from "../models/ProjectModel.js";

export interface Runner {
    run(
        projectPath: string,
        imageName: string,
        port: number,
        model?: ProjectModel
    ): Promise<string>;

    writeDockerfile?(
        projectPath: string,
        content: string
    ): Promise<void>;

    writeDockerCompose?(
        projectPath: string,
        content: string
    ): Promise<void>;
}