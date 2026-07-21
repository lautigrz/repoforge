export type TechnologyCategory =
    | "language"
    | "framework"
    | "database"
    | "service"
    | "tool"
    | "runtime";


export interface Technology {

    name: string;

    category: TechnologyCategory;

    confidence: number;

    evidence: string[];

}