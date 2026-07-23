export interface Runner {

    run(
        projectPath: string,
        imageName: string,
        port: number
    ): Promise<string>;

}