import Anthropic from '@anthropic-ai/sdk';

export class Chat {
  private anthropic: Anthropic;

  constructor(apikey: string) {
    this.anthropic = new Anthropic({
      apiKey: apikey,
      baseURL: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
      timeout: parseInt(process.env.API_TIMEOUT_MS || '300000')
    });
  }

  private generateSystemPrompt = () => {
    return process.env.PROMPT || 'Please review the following code patch. Focus on potential bugs, risks, and improvement suggestions.';
  };

  private generateUserPrompt = (patch: string) => {
    const answerLanguage = process.env.LANGUAGE
        ? `Answer me in ${process.env.LANGUAGE},`
        : '';

    const jsonFormatRequirement = '\nProvide your feedback in a strict JSON format with the following structure:\n' +
        '{\n' +
        '  "reviews": [\n' +
        '    {\n' +
        '      "hunk_header": string, // The @@ hunk header (e.g., "@@ -10,5 +10,7 @@"), optional\n' +
        '      "lgtm": boolean, // true if this hunk looks good, false if there are concerns\n' +
        '      "review_comment": string // Your detailed review comments for this hunk. Can use markdown syntax. Empty string if lgtm is true.\n' +
        '    }\n' +
        '  ]\n' +
        '}\n' +
        'Review each hunk (marked by @@) separately and provide feedback for hunks that need improvement.\n' +
        'Ensure your response is a valid JSON object with a reviews array.\n';

    return `${jsonFormatRequirement} ${answerLanguage}:\n${patch}`;
  };

  public codeReview = async (patch: string): Promise<Array<{ lgtm: boolean, review_comment: string, hunk_header?: string }> | { lgtm: boolean, review_comment: string, hunk_header?: string }> => {
    if (!patch) {
      return {
        lgtm: true,
        review_comment: ""
      };
    }

    console.time('code-review cost');
    const systemPrompt = this.generateSystemPrompt();
    const userPrompt = this.generateUserPrompt(patch);

    const response = await this.anthropic.messages.create({
      model: process.env.MODEL || 'claude-sonnet-4-20250514',
      max_tokens: parseInt(process.env.max_tokens || '4096'),
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }]
    });

    console.timeEnd('code-review cost');

    if (response.content.length > 0) {
      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      try {
        const json = JSON.parse(text);
        // If response has a 'reviews' array, return it directly
        if (json.reviews && Array.isArray(json.reviews)) {
          return json.reviews;
        }
        // Otherwise, treat as a single review response
        return json;
      } catch (e) {
        return {
          lgtm: false,
          hunk_header: patch.split('\n')[0].startsWith('@@') ? patch.split('\n')[0] : undefined,
          review_comment: text
        }
      }
    }

    return {
      lgtm: true,
      review_comment: ""
    }
  };
}
