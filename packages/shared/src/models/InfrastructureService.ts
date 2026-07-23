export interface InfrastructureService {
    name: string;
    category: "database" | "cache" | "queue" | "search" | string;
    image: string;
    port: number;
    internalPort?: number;
    envVars: Record<string, string>;
    volumes?: Array<{
        name?: string;
        source?: string;
        target: string;
    }>;
    healthCheck?: {
        test: string | string[];
        interval?: string;
        timeout?: string;
        retries?: number;
    };
    metadata?: Record<string, unknown>;
}
