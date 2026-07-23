export interface DiagnosticError {
    title: string;
    cause: string;
    suggestedFix: string;
    rawError: string;
    patternId?: string;
}

export interface DiagnosticResult {
    hasErrors: boolean;
    errors: DiagnosticError[];
    warnings: string[];
}
