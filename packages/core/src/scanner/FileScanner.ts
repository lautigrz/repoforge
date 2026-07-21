import fg from "fast-glob";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

import type { ProjectContext } from "@repoforge/shared";


export class FileScanner {


    async scan(
        rootPath: string
    ): Promise<ProjectContext> {


        const absolutePath = path.resolve(rootPath);


        const files = await fg(
            [
                "**/*"
            ],
            {
                cwd: absolutePath,

                ignore: [
                    "node_modules/**",
                    ".git/**",
                    "dist/**",
                    "build/**"
                ],

                onlyFiles: true,

                dot: true
            }
        );


        return {

            rootPath: absolutePath,

            files,


            fileExists(filePath: string): boolean {

                return existsSync(
                    path.join(
                        absolutePath,
                        filePath
                    )
                );

            },


            async readFile(filePath: string) {

                try {

                    return await readFile(
                        path.join(
                            absolutePath,
                            filePath
                        ),
                        "utf-8"
                    );

                } catch {

                    return null;

                }

            }

        };

    }

}