import type {
  AIAnalysisRequest,
  AIAnalysisResult,
  AIProvider,
  AIService,
} from './types';

/**
 * Phase 0 service boundary only. No provider is constructed and no API call occurs.
 */
export class AdvisorAIService implements AIService {
  constructor(private readonly provider: AIProvider) {}

  analyze(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    return this.provider.generate(request);
  }
}
