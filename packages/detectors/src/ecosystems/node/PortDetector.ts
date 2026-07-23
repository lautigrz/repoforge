import type {
    Detector,
    ProjectContext,
    ProjectModel
} from "@repoforge/shared";


export class PortDetector implements Detector {

    readonly name = "port";


    async detect(
        context: ProjectContext,
        model: ProjectModel
    ): Promise<void> {


        for (const file of context.files) {


            if (
                !file.endsWith(".ts") &&
                !file.endsWith(".js")
            ) {
                continue;
            }


            const content =
                await context.readFile(file);


            if (!content) {
                continue;
            }


            // const PORT = process.env.PORT || 3000
            const envMatch =
                content.match(
                    /process\.env\.PORT\s*\|\|\s*(\d+)/
                );


            if (envMatch) {

                model.server = {
                    port: Number(envMatch[1])
                };

                return;
            }


            // app.listen(3000)
            const listenMatch =
                content.match(
                    /\.listen\(\s*(\d+)/
                );


            if (listenMatch) {

                model.server = {
                    port: Number(listenMatch[1])
                };

                return;
            }

        }

    }

}