import {
  DEFAULT_AI_MODEL,
  ENABLE_CLAUDE_FOR_ALL_CLIENTS,
} from "../configs/env.configs";

export type AIProvider = "anthropic" | "openai" | "local" | "unknown";

export type AIClientConfig = {
  provider: AIProvider;
  model: string;
  enabled: boolean;
};

/**
 * Decide provider based on model name heuristics.
 * - claude* -> anthropic
 * - gpt-* or gpt* -> openai
 * - local/* -> local
 */
function inferProviderFromModel(model: string): AIProvider {
  const m = model.toLowerCase();
  if (m.includes("claude") || m.includes("haiku")) return "anthropic";
  if (m.startsWith("gpt") || m.includes("gpt-")) return "openai";
  if (m.startsWith("local/") || m.includes("localhost")) return "local";
  return "unknown";
}

/**
 * Returns the AI client configuration to use for all clients.
 * Services should use this to choose which SDK/client to instantiate.
 */
export function getGlobalAIClientConfig(): AIClientConfig {
  // If enabled flag is set, prefer Claude Haiku regardless of DEFAULT_AI_MODEL
  if (ENABLE_CLAUDE_FOR_ALL_CLIENTS) {
    return {
      provider: inferProviderFromModel(DEFAULT_AI_MODEL),
      model: DEFAULT_AI_MODEL,
      enabled: true,
    };
  }

  // fallback to the default model selection
  return {
    provider: inferProviderFromModel(DEFAULT_AI_MODEL),
    model: DEFAULT_AI_MODEL,
    enabled: false,
  };
}

/**
 * Create a minimal client stub object describing how a real client should look.
 * This is intentionally light-weight: integrate your preferred SDK (Anthropic/OpenAI)
 * and replace this factory with a real implementation when you're ready.
 */
export function createAIClientStub() {
  const cfg = getGlobalAIClientConfig();

  return {
    config: cfg,
    async sendMessage(input: { text: string; maxTokens?: number }) {
      // Placeholder behaviour: return metadata only. Replace with real SDK calls.
      return {
        ok: false,
        message: `AI client stub invoked (provider=${cfg.provider}, model=${cfg.model}). Replace with real SDK.`,
        input,
      } as const;
    },
  };
}

export default {
  getGlobalAIClientConfig,
  createAIClientStub,
};
