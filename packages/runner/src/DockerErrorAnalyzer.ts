import type { DiagnosticError, DiagnosticResult } from "@repoforge/shared";

export class DockerErrorAnalyzer {
    analyze(rawOutput: string): DiagnosticResult {
        const errors: DiagnosticError[] = [];
        const warnings: string[] = [];

        // 1. ERR_PNPM_IGNORED_BUILDS
        if (rawOutput.includes("ERR_PNPM_IGNORED_BUILDS") || rawOutput.includes("ignored builds")) {
            errors.push({
                title: "ERR_PNPM_IGNORED_BUILDS",
                cause: "pnpm >=10 requires explicitly approved build dependencies.",
                suggestedFix: "Add 'onlyBuiltDependencies' to package.json or enable corepack approval in build options.",
                rawError: rawOutput,
                patternId: "ERR_PNPM_IGNORED_BUILDS"
            });
        }

        // 2. Prisma schema missing / generation failure
        if (rawOutput.includes("prisma:error") || rawOutput.includes("Could not find a schema.prisma") || rawOutput.includes("PrismaClientInitializationError")) {
            errors.push({
                title: "Prisma Schema / Client Error",
                cause: "Prisma schema file was not found or client was not generated.",
                suggestedFix: "Ensure 'prisma/schema.prisma' exists and execute 'pnpm exec prisma generate' before build.",
                rawError: rawOutput,
                patternId: "PRISMA_SCHEMA_MISSING"
            });
        }

        // 3. Script missing
        if (rawOutput.includes("missing script: start") || rawOutput.includes("npm ERR! Missing script:")) {
            errors.push({
                title: "Missing Start Script",
                cause: "package.json does not define a production start script.",
                suggestedFix: "Add a 'start' or 'start:prod' script to package.json (e.g. \"start\": \"node dist/index.js\").",
                rawError: rawOutput,
                patternId: "MISSING_START_SCRIPT"
            });
        }

        // 4. Port in use
        if (
            rawOutput.includes("EADDRINUSE") ||
            rawOutput.includes("address already in use") ||
            rawOutput.includes("port is already allocated") ||
            rawOutput.includes("Bind for 0.0.0.0")
        ) {
            errors.push({
                title: "Port Already In Use",
                cause: "The target host port is already bound by another running process or container.",
                suggestedFix: "Stop existing containers using 'docker stop' or specify a different port.",
                rawError: rawOutput,
                patternId: "PORT_IN_USE"
            });
        }

        // 5. TypeScript / tsconfig syntax error
        if (rawOutput.includes("tsconfig.json") && (rawOutput.includes("TS1005") || rawOutput.includes("TS1136") || rawOutput.includes("error TS"))) {
            errors.push({
                title: "TypeScript / tsconfig.json Compilation Error",
                cause: "The project's tsconfig.json file is malformed JSON or contains invalid syntax.",
                suggestedFix: "Ensure 'tsconfig.json' contains valid JSON with valid 'compilerOptions'.",
                rawError: rawOutput,
                patternId: "INVALID_TSCONFIG"
            });
        }

        // Generic fallback if error occurred but no pattern matched
        if (errors.length === 0 && rawOutput.length > 0) {
            errors.push({
                title: "Docker Build / Run Failure",
                cause: "An unhandled exception occurred during Docker execution.",
                suggestedFix: "Check the raw build log for syntax errors, missing files, or build dependency issues.",
                rawError: rawOutput
            });
        }

        return {
            hasErrors: errors.length > 0,
            errors,
            warnings
        };
    }

    formatDiagnostic(result: DiagnosticResult): string {
        const lines: string[] = [];
        lines.push("\n❌ Build / Execution Failed\n");

        for (const err of result.errors) {
            lines.push(`Detected error: ${err.title}`);
            lines.push(`Cause: ${err.cause}`);
            lines.push(`Suggested fix: ${err.suggestedFix}\n`);
        }

        return lines.join("\n");
    }
}
