import { type ProjectContext } from "@repoforge/shared";
import { PackageJson } from "./PackageJson.js";

export class PackageJsonReader {
    private readonly cache = new WeakMap<ProjectContext, PackageJson | null>();

    async read(context: ProjectContext): Promise<PackageJson | null> {
        const cached = this.cache.get(context);

        if (cached !== undefined) {
            return cached;
        }

        if (!context.fileExists("package.json")) {
            this.cache.set(context, null);
            return null;
        }

        const content = await context.readFile("package.json");

        if (!content) {
            this.cache.set(context, null);
            return null;
        }

        try {
            const packageJson = JSON.parse(content) as PackageJson;

            this.cache.set(context, packageJson);

            return packageJson;
        } catch {
            this.cache.set(context, null);
            return null;
        }
    }

    async getDependencies(
        context: ProjectContext
    ): Promise<Record<string, string>> {

        const packageJson = await this.read(context);

        if (!packageJson) {
            return {};
        }

        return {
            ...(packageJson.dependencies ?? {}),
            ...(packageJson.devDependencies ?? {}),
            ...(packageJson.optionalDependencies ?? {}),
            ...(packageJson.peerDependencies ?? {})
        };

    }

    async getScripts(
        context: ProjectContext
    ): Promise<Record<string, string>> {

        const packageJson = await this.read(context);

        if (!packageJson) {
            return {};
        }

        return packageJson.scripts ?? {};

    }
}