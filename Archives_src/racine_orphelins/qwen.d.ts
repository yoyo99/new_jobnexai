declare module 'qwen' {
  export class QwenClient {
    constructor(options: { apiKey: string; [key: string]: any });
    generate(params: { prompt: string; [key: string]: any }): Promise<{ output: { text: string; [key: string]: any }; [key: string]: any }>;
    // You can add other methods or refine types if you know the QwenClient API better.
    // For example, if 'generate' directly returns the text response:
    // generate(params: { prompt: string; [key: string]: any }): Promise<string>;
  }
}
