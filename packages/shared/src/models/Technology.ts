export type TechnologyCategory =
    | "language"
    | "framework"
    | "orm"
    | "database"
    | "cache"
    | "service"
    | "tool"
    | "runtime"
    | "testing";


export interface Technology {

    name: string;

    category: TechnologyCategory;

    confidence: number;

    evidence: string[];

    metadata?: Record<string, unknown>;

}