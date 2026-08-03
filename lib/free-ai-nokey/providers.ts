import type { ProviderDefinition, RouterMode, TaskType } from "./types";

export const PROVIDER_REGISTRY: Record<string, ProviderDefinition> = {
  puter: {
    id: "puter",
    label: "Puter.js",
    route: "chat",
    provider_class: "no_developer_key_wrapper",
    execution_planes: ["browser"],
    tier: "cloud",
    timeout_ms: 30000,
    enabled: true,
  },
  gradio_public_space: {
    id: "gradio_public_space",
    label: "Public Gradio Space",
    route: "chat",
    provider_class: "public_space_no_token",
    execution_planes: ["browser"],
    tier: "cloud",
    timeout_ms: 45000,
    enabled: process.env.FREEAI_NOKEY_GRADIO_ENABLED === "true",
  },
  ai_horde_anonymous: {
    id: "ai_horde_anonymous",
    label: "AI Horde Anonymous",
    route: "chat",
    provider_class: "anonymous_placeholder_provider",
    execution_planes: ["server"],
    tier: "cloud",
    timeout_ms: 120000,
    enabled: process.env.FREEAI_NOKEY_AIHORDE_ENABLED === "true",
  },
  webllm: {
    id: "webllm",
    label: "WebLLM",
    route: "chat",
    provider_class: "browser_local_ai",
    execution_planes: ["browser"],
    tier: "local",
    timeout_ms: 60000,
    enabled: true,
  },
  chrome_ai: {
    id: "chrome_ai",
    label: "Chrome Built-in AI",
    route: "chat",
    provider_class: "browser_local_ai",
    execution_planes: ["browser"],
    tier: "local",
    timeout_ms: 30000,
    enabled: true,
  },
  pollinations_text: {
    id: "pollinations_text",
    label: "Pollinations Text",
    route: "chat",
    provider_class: "public_no_key_url",
    execution_planes: ["server", "browser"],
    tier: "cloud",
    timeout_ms: 30000,
    enabled: true,
  },
  ollama: {
    id: "ollama",
    label: "Ollama Local",
    route: "chat",
    provider_class: "local_model_runtime",
    execution_planes: ["server"],
    tier: "local",
    timeout_ms: 60000,
    enabled: true,
  },
  pollinations_image: {
    id: "pollinations_image",
    label: "Pollinations Image",
    route: "image",
    provider_class: "public_no_key_url",
    execution_planes: ["server", "browser"],
    tier: "cloud",
    timeout_ms: 45000,
    enabled: true,
  },
  transformers_js: {
    id: "transformers_js",
    label: "Transformers.js",
    route: "local_task",
    provider_class: "browser_local_ai",
    execution_planes: ["browser"],
    tier: "local",
    timeout_ms: 30000,
    enabled: true,
  },
  onnx_runtime_web: {
    id: "onnx_runtime_web",
    label: "ONNX Runtime Web",
    route: "local_task",
    provider_class: "local_model_runtime",
    execution_planes: ["browser", "mobile"],
    tier: "local",
    timeout_ms: 30000,
    enabled: true,
  },
  tensorflow_js: {
    id: "tensorflow_js",
    label: "TensorFlow.js",
    route: "local_task",
    provider_class: "local_model_runtime",
    execution_planes: ["browser", "mobile"],
    tier: "local",
    timeout_ms: 30000,
    enabled: true,
  },
  mediapipe_genai: {
    id: "mediapipe_genai",
    label: "MediaPipe GenAI",
    route: "local_task",
    provider_class: "local_model_runtime",
    execution_planes: ["browser", "mobile"],
    tier: "local",
    timeout_ms: 30000,
    enabled: true,
  },
};

export const CASCADE_LISTS: Record<
  RouterMode,
  { chat?: string[]; image?: string[]; local_task?: string[] }
> = {
  power_first: {
    chat: [
      "puter",
      "gradio_public_space",
      "ai_horde_anonymous",
      "webllm",
      "chrome_ai",
      "pollinations_text",
      "ollama",
    ],
  },
  speed_first: {
    chat: [
      "chrome_ai",
      "puter",
      "pollinations_text",
      "webllm",
      "gradio_public_space",
      "ai_horde_anonymous",
      "ollama",
    ],
  },
  private_first: {
    chat: [
      "webllm",
      "chrome_ai",
      "transformers_js",
      "mediapipe_genai",
      "onnx_runtime_web",
      "tensorflow_js",
      "ollama",
      "puter",
      "gradio_public_space",
      "pollinations_text",
      "ai_horde_anonymous",
    ],
    local_task: [
      "transformers_js",
      "onnx_runtime_web",
      "tensorflow_js",
      "mediapipe_genai",
      "ollama",
    ],
  },
  image: {
    image: ["pollinations_image", "puter"],
  },
  local_task: {
    local_task: [
      "transformers_js",
      "onnx_runtime_web",
      "tensorflow_js",
      "mediapipe_genai",
      "ollama",
    ],
  },
};

export function baseCascadeForTask(task: TaskType, routerMode: RouterMode): string[] {
  if (task === "image") return CASCADE_LISTS.image.image ?? [];
  if (task === "local_task") {
    return (
      CASCADE_LISTS[routerMode].local_task ??
      CASCADE_LISTS.local_task.local_task ??
      []
    );
  }
  return CASCADE_LISTS[routerMode].chat ?? CASCADE_LISTS.power_first.chat ?? [];
}

export function isLocalProvider(providerId: string): boolean {
  return PROVIDER_REGISTRY[providerId]?.tier === "local";
}

export function isCloudProvider(providerId: string): boolean {
  return PROVIDER_REGISTRY[providerId]?.tier === "cloud";
}

export function getProvider(id: string): ProviderDefinition | undefined {
  return PROVIDER_REGISTRY[id];
}
