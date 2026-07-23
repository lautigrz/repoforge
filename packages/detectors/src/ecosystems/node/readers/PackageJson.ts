export interface PackageJson {
    name?: string;
    version?: string;

    scripts?: Record<string, string>;

    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
    engines?: {
        node?: string;
    };

    packageManager?: string;
    workspaces?: string[] | { packages?: string[] };
    volta?: {
        node?: string;
        npm?: string;
        pnpm?: string;
        yarn?: string;
    };
}
