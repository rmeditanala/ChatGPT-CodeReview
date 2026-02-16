export declare class Chat {
    private anthropic;
    constructor(apikey: string);
    private generateSystemPrompt;
    private generateUserPrompt;
    codeReview: (patch: string) => Promise<Array<{
        lgtm: boolean;
        review_comment: string;
        hunk_header?: string;
    }> | {
        lgtm: boolean;
        review_comment: string;
        hunk_header?: string;
    }>;
}
