import type { InfrastructureService } from "./InfrastructureService.js";
import type { MigrationConfig } from "./MigrationConfig.js";
import type { PackageManager } from "./PackageManager.js";
import type { Technology } from "./Technology.js";

export interface ProjectModel {
    technologies: Technology[];
    packageManagers: PackageManager[];
    scripts: Record<string, string>;
    commands: ProjectCommands;

    runtime: {
        name: string;
        version?: string;
    };

    server?: {
        port?: number;
    };

    dependencies: {
        production: Record<string, string>;
        development: Record<string, string>;
    };

    monorepo?: {
        isMonorepo: boolean;
        tool?: string;
        workspaceFile?: string;
        apps?: string[];
        packages?: string[];
        targetApp?: string;
    };

    docker?: {
        hasDockerfile: boolean;
        hasDockerCompose: boolean;
        hasDockerIgnore: boolean;
        dockerfilePath?: string;
        dockerComposePath?: string;
    };

    /**
     * Infrastructure services detected for the project (Databases, Caches, Queues, Search Engines, etc.)
     */
    services?: InfrastructureService[];

    /**
     * Migration configuration for the database / persistence layer
     */
    migrations?: MigrationConfig;

    /**
     * Generic ORM / Persistence metadata (Prisma, TypeORM, Hibernate, Drizzle, Entity Framework, etc.)
     */
    orm?: {
        name: string;
        schemaPath?: string;
        hasSchema?: boolean;
        metadata?: Record<string, unknown>;
    };

    /**
     * Optional Prisma helper block for Node.js backward compatibility
     */
    prisma?: {
        hasPrisma: boolean;
        schemaPath?: string;
    };

    /**
     * Generic ecosystem metadata store for language/framework specific extra state
     */
    metadata?: Record<string, unknown>;

    options?: {
        compat?: boolean;
        multiStage?: boolean;
        [key: string]: unknown;
    };
}

export interface ProjectCommands {
    development?: CommandInfo;
    build?: CommandInfo;
    production?: CommandInfo;
    test?: CommandInfo;
}

export interface CommandInfo {
    script: string;
    command: string;
}