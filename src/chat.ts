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

  public codeReview = async (patch: string): Promise<{ lgtm: boolean, review_comment?: string }> => {
    const systemPrompt = process.env.REVIEW_PROMPT || `You are a code reviewer. Focus on:
- Critical bugs and security vulnerabilities
- Logic errors
- Performance issues
IGNORE linting and style issues.

Format your response as clean markdown with:
- Clear headings (###)
- Bullet points for issues
- Code blocks for suggestions`;

    const answerLanguage = process.env.LANGUAGE
      ? `\n\nPlease respond in ${process.env.LANGUAGE}.`
      : '';

    const response = await this.anthropic.messages.create({
      model: process.env.MODEL || 'claude-sonnet-4-20250514',
      max_tokens: parseInt(process.env.max_tokens || '4096'),
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Review this code change:\n\n\`\`\`diff\n${patch}\n\`\`\`${answerLanguage}\n\nIf issues found, respond with markdown. If LGTM, respond with just "LGTM".`
      }]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';

    if (content.trim() === 'LGTM') {
      return { lgtm: true };
    }

    return {
      lgtm: false,
      review_comment: content
    };
  };
}
