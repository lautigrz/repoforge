import type { Detector, InfrastructureService, ProjectContext, ProjectModel } from "@repoforge/shared";
import { PackageJsonReader } from "../readers/PackageJsonReader.js";

interface DbDefinition {
    name: string;
    category: "database" | "cache";
    deps: string[];
    urlPrefixes: string[];
    prismaProviders: string[];
    defaultImage: string;
    defaultPort: number;
    envVars: (projectName: string) => Record<string, string>;
    volumeName: (projectName: string) => string;
    volumeTarget: string;
    healthCheck: {
        test: string[];
        interval: string;
        timeout: string;
        retries: number;
    };
}

const DB_DEFINITIONS: DbDefinition[] = [
    {
        name: "postgres",
        category: "database",
        deps: ["pg", "pg-pool", "postgres"],
        urlPrefixes: ["postgres://", "postgresql://"],
        prismaProviders: ["postgresql", "postgres"],
        defaultImage: "postgres:16-alpine",
        defaultPort: 5432,
        envVars: (name) => ({
            POSTGRES_DB: `${name}_db`,
            POSTGRES_USER: "postgres",
            POSTGRES_PASSWORD: "postgres_password"
        }),
        volumeName: (name) => `${name}_pgdata`,
        volumeTarget: "/var/lib/postgresql/data",
        healthCheck: {
            test: ["CMD-SHELL", "pg_isready -U postgres"],
            interval: "5s",
            timeout: "5s",
            retries: 5
        }
    },
    {
        name: "mysql",
        category: "database",
        deps: ["mysql", "mysql2"],
        urlPrefixes: ["mysql://"],
        prismaProviders: ["mysql"],
        defaultImage: "mysql:8.0",
        defaultPort: 3306,
        envVars: (name) => ({
            MYSQL_DATABASE: `${name}_db`,
            MYSQL_ROOT_PASSWORD: "root_password",
            MYSQL_USER: "mysql_user",
            MYSQL_PASSWORD: "mysql_password"
        }),
        volumeName: (name) => `${name}_mysqldata`,
        volumeTarget: "/var/lib/mysql",
        healthCheck: {
            test: ["CMD-SHELL", "mysqladmin ping -u root -proot_password || exit 1"],
            interval: "5s",
            timeout: "5s",
            retries: 10
        }
    },
    {

        name: "mongodb",
        category: "database",
        deps: ["mongodb", "mongoose"],
        urlPrefixes: ["mongodb://", "mongodb+srv://"],
        prismaProviders: ["mongodb"],
        defaultImage: "mongo:7.0",
        defaultPort: 27017,
        envVars: (name) => ({
            MONGO_INITDB_DATABASE: `${name}_db`
        }),
        volumeName: (name) => `${name}_mongodata`,
        volumeTarget: "/data/db",
        healthCheck: {
            test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"],
            interval: "5s",
            timeout: "5s",
            retries: 5
        }
    },
    {
        name: "redis",
        category: "cache",
        deps: ["redis", "ioredis"],
        urlPrefixes: ["redis://", "rediss://"],
        prismaProviders: [],
        defaultImage: "redis:7-alpine",
        defaultPort: 6379,
        envVars: () => ({}),
        volumeName: (name) => `${name}_redisdata`,
        volumeTarget: "/data",
        healthCheck: {
            test: ["CMD", "redis-cli", "ping"],
            interval: "5s",
            timeout: "5s",
            retries: 5
        }
    }
];

export class DatabaseDetector implements Detector {
    readonly name = "database";

    constructor(private readonly packageJsonReader: PackageJsonReader) { }

    async detect(context: ProjectContext, model: ProjectModel): Promise<void> {
        const deps = await this.packageJsonReader.getDependencies(context);
        const activeEnvVars = await this.readActiveEnvVars(context);
        const prismaProvider = await this.detectPrismaProvider(context);

        model.services = model.services ?? [];

        const projectName = context.rootPath
            ? context.rootPath.split(/[/\\]/).pop()?.toLowerCase().replace(/[^a-z0-9]/g, "_") ?? "app"
            : "app";

        for (const dbDef of DB_DEFINITIONS) {
            // 1. Check direct driver dependencies
            const hasDep = dbDef.deps.some(dep => Boolean(deps[dep]));

            // 2. Check active (uncommented) connection URL in env files
            const hasActiveUrl = Object.values(activeEnvVars).some(val =>
                dbDef.urlPrefixes.some(prefix => val.includes(prefix))
            );

            // 3. Check explicit Prisma provider from schema.prisma
            const isPrismaMatch = Boolean(
                prismaProvider && dbDef.prismaProviders.includes(prismaProvider)
            );

            if (hasDep || hasActiveUrl || isPrismaMatch) {
                const alreadyAdded = model.services.some(s => s.name === dbDef.name);
                if (!alreadyAdded) {
                    const service: InfrastructureService = {
                        name: dbDef.name,
                        category: dbDef.category,
                        image: dbDef.defaultImage,
                        port: dbDef.defaultPort,
                        internalPort: dbDef.defaultPort,
                        envVars: dbDef.envVars(projectName),
                        volumes: [
                            {
                                name: dbDef.volumeName(projectName),
                                target: dbDef.volumeTarget
                            }
                        ],
                        healthCheck: dbDef.healthCheck
                    };

                    model.services.push(service);

                    // Add to technologies list if not present
                    const techExists = model.technologies.some(t => t.name.toLowerCase() === dbDef.name);
                    if (!techExists) {
                        model.technologies.push({
                            name: dbDef.name,
                            category: dbDef.category,
                            confidence: 1,
                            evidence: [
                                hasDep
                                    ? `dependency: ${dbDef.deps.find(d => deps[d])}`
                                    : isPrismaMatch
                                        ? `prisma provider: ${prismaProvider}`
                                        : "active connection URL in env"
                            ]
                        });
                    }
                }
            }
        }
    }

    private async readActiveEnvVars(context: ProjectContext): Promise<Record<string, string>> {
        const result: Record<string, string> = {};
        const envFiles = [".env", ".env.local", ".env.development", ".env.production"];

        for (const file of envFiles) {
            if (context.fileExists(file)) {
                try {
                    const content = await context.readFile(file);
                    if (!content) continue;
                    const lines = content.split("\n");
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || trimmed.startsWith("#")) continue;

                        const eqIndex = trimmed.indexOf("=");
                        if (eqIndex > 0) {
                            const key = trimmed.substring(0, eqIndex).trim();
                            const val = trimmed.substring(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
                            result[key] = val;
                        }
                    }
                } catch {
                    // Ignore unreadable env files
                }
            }
        }
        return result;
    }

    private async detectPrismaProvider(context: ProjectContext): Promise<string | undefined> {
        const schemaPaths = ["prisma/schema.prisma", "schema.prisma"];
        for (const schemaPath of schemaPaths) {
            if (context.fileExists(schemaPath)) {
                try {
                    const content = await context.readFile(schemaPath);
                    if (!content) continue;
                    const match = content.match(/provider\s*=\s*["']([^"']+)["']/);
                    if (match && match[1]) {
                        return match[1].toLowerCase();
                    }
                } catch {
                    // Ignore unreadable schema
                }
            }
        }
        return undefined;
    }
}
