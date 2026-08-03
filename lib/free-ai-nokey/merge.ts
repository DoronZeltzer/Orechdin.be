import {
  baseCascadeForTask,
  getProvider,
  isCloudProvider,
  isLocalProvider,
} from "./providers";
import type {
  CapacitySnapshot,
  ExecutionPlane,
  LocalVsCloudPriority,
  RouterMode,
  SanitizeReport,
  TaskType,
} from "./types";
import { globalCircuitBreaker } from "./resilience";

export function buildUnifiedProviderQueue(args: {
  task: TaskType;
  router_mode: RouterMode;
  execution_plane: ExecutionPlane;
  local_vs_cloud_priority: LocalVsCloudPriority;
  sanitize: SanitizeReport;
  capacity: CapacitySnapshot;
}): string[] {
  const backbone = baseCascadeForTask(args.task, args.router_mode);
  const filtered = backbone.filter((id) => {
    const def = getProvider(id);
    if (!def || !def.enabled) return false;
    if (globalCircuitBreaker.isOpen(id)) return false;
    if (id === "ollama" && !args.capacity.ollama_ready) return false;
    if (!args.sanitize.allowed_to_route_externally && isCloudProvider(id)) return false;
    return true;
  });

  return reorderByLocalCloudPriority(filtered, args.local_vs_cloud_priority);
}

export function reorderByLocalCloudPriority(
  queue: string[],
  priority: LocalVsCloudPriority,
): string[] {
  const local = queue.filter((id) => isLocalProvider(id));
  const cloud = queue.filter((id) => isCloudProvider(id));

  switch (priority) {
    case "local_preferred":
      return [...local, ...cloud];
    case "cloud_preferred":
      return [...cloud, ...local];
    case "balanced":
    case "auto":
    default: {
      const out: string[] = [];
      const max = Math.max(local.length, cloud.length);
      for (let i = 0; i < max; i++) {
        if (i < cloud.length) out.push(cloud[i]);
        if (i < local.length) out.push(local[i]);
      }
      return out.filter((id, idx) => out.indexOf(id) === idx);
    }
  }
}

export function setupSuggestions(args: {
  queue: string[];
  ollama_ready: boolean;
  execution_plane: ExecutionPlane;
}): string[] {
  const out: string[] = [];
  if (!args.ollama_ready && args.queue.includes("ollama")) {
    out.push("Install Ollama locally and pull a model (e.g. llama3.2) for private-first routing.");
  }
  if (args.execution_plane === "server") {
    out.push("Browser-only providers (Puter.js, WebLLM, Chrome AI) require the browser execution plane.");
  }
  if (out.length === 0) {
    out.push("All keyless providers are temporarily unavailable. Retry later or contact support.");
  }
  return out;
}
