export interface ProjectContext {
    rootPath: string;

    files: string[];

    fileExists(path: string): boolean;

    readFile(path: string): Promise<string | null>;
}