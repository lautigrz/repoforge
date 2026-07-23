import type { InfrastructureService, ProjectModel } from "@repoforge/shared";

export class DockerComposeGenerator {
    generate(model: ProjectModel): string {
        const services = model.services ?? [];
        const appPort = model.server?.port ?? 3000;
        const appName = "app";

        const lines: string[] = [];
        lines.push('version: "3.8"');
        lines.push("");
        lines.push("services:");

        // --- Main App Service ---
        lines.push(`  ${appName}:`);
        lines.push("    build:");
        lines.push("      context: .");
        lines.push("      dockerfile: Dockerfile");
        lines.push("    restart: always");
        lines.push("    ports:");
        lines.push(`      - "${appPort}:${appPort}"`);

        if (model.migrations?.command) {
            const startCmd = model.commands?.production?.command ?? "pnpm start";
            lines.push(`    command: sh -c "${model.migrations.command} && ${startCmd}"`);
        }

        const envVars: Record<string, string> = {
            NODE_ENV: "production",
            PORT: appPort.toString()
        };

        // Wire database connection strings to environment variables
        for (const s of services) {
            if (s.name === "postgres") {
                const user = s.envVars["POSTGRES_USER"] ?? "postgres";
                const pass = s.envVars["POSTGRES_PASSWORD"] ?? "postgres_password";
                const db = s.envVars["POSTGRES_DB"] ?? "app_db";
                envVars["DATABASE_URL"] = `postgresql://${user}:${pass}@${s.name}:${s.port}/${db}?schema=public`;
            } else if (s.name === "mysql") {
                const user = s.envVars["MYSQL_USER"] ?? "mysql_user";
                const pass = s.envVars["MYSQL_PASSWORD"] ?? "mysql_password";
                const db = s.envVars["MYSQL_DATABASE"] ?? "app_db";
                envVars["DATABASE_URL"] = `mysql://${user}:${pass}@${s.name}:${s.port}/${db}`;
            } else if (s.name === "mongodb") {
                const db = s.envVars["MONGO_INITDB_DATABASE"] ?? "app_db";
                envVars["MONGODB_URI"] = `mongodb://${s.name}:${s.port}/${db}`;
            } else if (s.name === "redis") {
                envVars["REDIS_URL"] = `redis://${s.name}:${s.port}`;
            }
        }

        lines.push("    environment:");
        for (const [k, v] of Object.entries(envVars)) {
            lines.push(`      - ${k}=${v}`);
        }

        if (services.length > 0) {
            lines.push("    depends_on:");
            for (const s of services) {
                lines.push(`      ${s.name}:`);
                lines.push("        condition: service_healthy");
            }
        }

        lines.push("    networks:");
        lines.push("      - repoforge-net");

        // --- Infrastructure Services (Databases, Caches) ---
        const namedVolumes: string[] = [];

        for (const s of services) {
            lines.push("");
            lines.push(`  ${s.name}:`);
            lines.push(`    image: ${s.image}`);
            lines.push(`    container_name: repoforge-${s.name}`);
            lines.push("    restart: always");
            lines.push("    ports:");
            lines.push(`      - "${s.port}:${s.internalPort ?? s.port}"`);

            if (Object.keys(s.envVars).length > 0) {
                lines.push("    environment:");
                for (const [k, v] of Object.entries(s.envVars)) {
                    lines.push(`      - ${k}=${v}`);
                }
            }

            if (s.volumes && s.volumes.length > 0) {
                lines.push("    volumes:");
                for (const v of s.volumes) {
                    const volName = v.name ?? `${s.name}_data`;
                    lines.push(`      - ${volName}:${v.target}`);
                    if (!namedVolumes.includes(volName)) {
                        namedVolumes.push(volName);
                    }
                }
            }

            if (s.healthCheck) {
                lines.push("    healthcheck:");
                const testArray = Array.isArray(s.healthCheck.test)
                    ? s.healthCheck.test
                    : [s.healthCheck.test];
                lines.push(`      test: ${JSON.stringify(testArray)}`);
                lines.push(`      interval: ${s.healthCheck.interval ?? "5s"}`);
                lines.push(`      timeout: ${s.healthCheck.timeout ?? "5s"}`);
                lines.push(`      retries: ${s.healthCheck.retries ?? 20}`);
                lines.push("      start_period: 60s");
            }

            lines.push("    networks:");
            lines.push("      - repoforge-net");
        }

        // --- Top-level Volumes ---
        if (namedVolumes.length > 0) {
            lines.push("");
            lines.push("volumes:");
            for (const vol of namedVolumes) {
                lines.push(`  ${vol}:`);
            }
        }

        // --- Top-level Networks ---
        lines.push("");
        lines.push("networks:");
        lines.push("  repoforge-net:");
        lines.push("    driver: bridge");

        return lines.join("\n");
    }
}
