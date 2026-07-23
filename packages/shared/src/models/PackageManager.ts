export interface PackageManager {
    name: string;
    ecosystem: string;
    lockFile?: string;
    installCommand?: string;
    version?: string;
    useCorepack?: boolean;
    packageManagerField?: string;
    metadata?: Record<string, unknown>;
}