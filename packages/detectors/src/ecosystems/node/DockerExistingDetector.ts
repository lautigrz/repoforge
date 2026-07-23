import type { Detector, ProjectContext, ProjectModel } from "@repoforge/shared";

export class DockerExistingDetector implements Detector {
    readonly name = "docker-existing";

    async detect(
        context: ProjectContext,
        model: ProjectModel
    ): Promise<void> {
        const hasDockerfile = context.fileExists("Dockerfile");
        const hasDockerCompose = context.fileExists("docker-compose.yml") || context.fileExists("docker-compose.yaml");
        const hasDockerIgnore = context.fileExists(".dockerignore");

        if (hasDockerfile || hasDockerCompose || hasDockerIgnore) {
            model.docker = {
                hasDockerfile,
                hasDockerCompose,
                hasDockerIgnore,
                dockerfilePath: hasDockerfile ? "Dockerfile" : undefined,
                dockerComposePath: hasDockerCompose ? (context.fileExists("docker-compose.yml") ? "docker-compose.yml" : "docker-compose.yaml") : undefined
            };
        }
    }
}
