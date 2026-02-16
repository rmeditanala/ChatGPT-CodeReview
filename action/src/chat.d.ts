export declare class Chat {
    private anthropic;
    constructor(apikey: string);
    codeReview: (patch: string) => Promise<{
        lgtm: boolean;
        review_comment?: string;
    }>;
}
