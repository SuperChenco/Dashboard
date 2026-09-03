export type AIInputReference = {
  entityType: string;
  entityId: string;
  version?: string;
};

export type AIAnalysisRequest = {
  task: string;
  promptVersion: string;
  inputReferences: AIInputReference[];
  structuredInput?: Record<string, unknown>;
};

export type AIAnalysisResult = {
  runId: string;
  model: string;
  promptVersion: string;
  output: unknown;
  status: 'completed';
};

export interface AIService {
  analyze(request: AIAnalysisRequest): Promise<AIAnalysisResult>;
}

export interface AIProvider {
  generate(request: AIAnalysisRequest): Promise<AIAnalysisResult>;
}
