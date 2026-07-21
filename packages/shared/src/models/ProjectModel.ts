import { PackageManager } from "./PackageManager.js";
import type { Technology } from "./Technology.js";


export interface ProjectModel {

    technologies: Technology[];

    packageManagers: PackageManager[];

    scripts: Record<string, string>;

    commands: Record<string, string>;

    dependencies: {

        production: Record<string, string>;
        development: Record<string, string>;

    };

}