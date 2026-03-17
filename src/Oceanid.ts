import { Tokenizer, StopWords } from '@sciactive/tokenizer';

export class Oceanid {
  constructor() {}

  getTokens(
    input: string,
    language: 'english' | 'spanish' | 'french' | 'arabic' = 'english',
  ) {
    const tokenizer = new Tokenizer({
      language,
      stopWords: StopWords[language],
    });
    const tokens = tokenizer.detailedTokenize(input);
    return tokens;
  }
}
