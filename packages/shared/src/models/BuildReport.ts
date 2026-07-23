import type { DiagnosticError } from "./DiagnosticResult.js";

export interface BuildReport {
    isSuccess: boolean;
    runtime: string;
    nodeVersion: string;
    packageManager: string;
    pmVersion?: string;
    technologies: string[];
    isMonorepo?: boolean;
    hasPrisma?: boolean;
    multiStage?: boolean;
    imageName?: string;
    imageSize?: string;
    startupTimeSeconds?: number;
    port?: number;
    url?: string;
    warnings: string[];
    errors: DiagnosticError[];
}
