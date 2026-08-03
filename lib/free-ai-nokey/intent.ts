import type {
  ExecutionPlane,
  IntentProfile,
  LocalVsCloudPriority,
  RouterMode,
  TaskType,
} from "./types";

export interface IntakeRecord {
  task: TaskType;
  router_mode: RouterMode;
  execution_plane: ExecutionPlane;
  intent_profile: IntentProfile;
  local_vs_cloud_priority: LocalVsCloudPriority;
  local_vs_cloud_reason: string;
}

function classifyIntentProfile(prompt: string): IntentProfile {
  const p = (prompt || "").toLowerCase();
  return {
    privacy_sensitive: /(private|confidential|pii|password|credential|health|medical|legal|gdpr|avg|persoonsgegevens)/i.test(
      p,
    ),
    offline_required: /(offline|local only|on-device|on device|don't send to cloud|do not send to cloud|zonder cloud)/i.test(
      p,
    ),
    latency_sensitive: /(fast|quick|asap|urgent|snel|rapidement)/i.test(p),
    reasoning_depth: /(research|analyze|detailed|comprehensive|deep|step by step|multi-step)/i.test(p)
      ? "deep"
      : /(brief|short|one line|quick)/i.test(p)
        ? "shallow"
        : "standard",
    creative_generation: /(write|story|poem|creative|image|draw|generate picture)/i.test(p),
    factual_grounding_required: /(cite|source|evidence|fact|verify|grounded|published)/i.test(p),
    multimodal: /(image|photo|picture|screenshot|visual)/i.test(p),
  };
}

function resolveLocalVsCloudPriority(args: {
  profile: IntentProfile;
  use_local: boolean | null | undefined;
  sanitizeBlocksExternal: boolean;
  ollamaReady: boolean;
}): { priority: LocalVsCloudPriority; reason: string } {
  const { profile, use_local, sanitizeBlocksExternal, ollamaReady } = args;

  if (use_local === true) {
    return {
      priority: "local_preferred",
      reason: "User knob use_local=true overrides intent classification.",
    };
  }
  if (use_local === false) {
    return {
      priority: "cloud_preferred",
      reason: "User knob use_local=false overrides intent classification.",
    };
  }
  if (sanitizeBlocksExternal) {
    return {
      priority: "local_preferred",
      reason: "Sanitize blocked external routing; local tier only.",
    };
  }
  if (profile.privacy_sensitive || profile.offline_required) {
    return {
      priority: "local_preferred",
      reason: "Privacy-sensitive or offline-required signals in prompt.",
    };
  }
  if (profile.reasoning_depth === "deep") {
    return {
      priority: "cloud_preferred",
      reason: "Deep reasoning requested; cloud tier preferred when healthy.",
    };
  }
  if (profile.latency_sensitive && ollamaReady) {
    return {
      priority: "local_preferred",
      reason: "Latency-sensitive prompt with READY_LOCAL Ollama.",
    };
  }
  if (profile.creative_generation) {
    return {
      priority: "cloud_preferred",
      reason: "Creative generation without privacy signals.",
    };
  }
  return {
    priority: "balanced",
    reason: "No strong local/cloud signals; balanced interleaving.",
  };
}

export function classifyIntake(args: {
  prompt: string;
  task?: TaskType;
  router_mode?: RouterMode | null;
  execution_plane?: ExecutionPlane;
  use_local?: boolean | null;
  sanitizeBlocksExternal: boolean;
  ollamaReady: boolean;
}): IntakeRecord {
  const profile = classifyIntentProfile(args.prompt);

  let task: TaskType = args.task ?? "chat";
  if (profile.multimodal && !args.task) task = "chat";

  let router_mode: RouterMode = args.router_mode ?? "power_first";
  if (args.use_local === true) router_mode = "private_first";
  if (args.use_local === false) router_mode = "power_first";
  if (task === "image") router_mode = "image";
  if (task === "local_task") router_mode = "local_task";
  if (profile.latency_sensitive && !args.router_mode && args.use_local == null) {
    router_mode = "speed_first";
  }

  const { priority, reason } = resolveLocalVsCloudPriority({
    profile,
    use_local: args.use_local,
    sanitizeBlocksExternal: args.sanitizeBlocksExternal,
    ollamaReady: args.ollamaReady,
  });

  return {
    task,
    router_mode,
    execution_plane: args.execution_plane ?? "server",
    intent_profile: profile,
    local_vs_cloud_priority: priority,
    local_vs_cloud_reason: reason,
  };
}

export function alternateRouterMode(current: RouterMode): RouterMode | null {
  const order: RouterMode[] = ["power_first", "speed_first", "private_first"];
  const idx = order.indexOf(current);
  if (idx < 0 || idx >= order.length - 1) return null;
  return order[idx + 1];
}
