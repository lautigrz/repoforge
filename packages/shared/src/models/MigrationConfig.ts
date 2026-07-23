export interface MigrationConfig {
    hasMigrations: boolean;
    tool?: string;
    command?: string;
    metadata?: Record<string, unknown>;
}
