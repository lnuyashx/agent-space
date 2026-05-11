import type { AgentSpaceData, AgentSpaceLocalRuntime, AgentSpaceLocalRuntimeAgentState, AgentSpaceLocalRuntimeManifest } from "./types";

const LOCAL_RUNTIME_MANIFEST_URL = "./local-agent-space/pet-manifest.json";
const LOCAL_AGENT_STATE_URL = "./local-agent-space/agent-state.json";

function fallbackRuntime(agentStateAvailable = false): AgentSpaceLocalRuntime {
  return {
    schemaVersion: 1,
    status: "fallback",
    manifestPath: LOCAL_RUNTIME_MANIFEST_URL,
    agentStatePath: LOCAL_AGENT_STATE_URL,
    agentStateAvailable,
    pet: null,
    agentState: normalizeAgentState(null, null),
  };
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json() as T;
  } catch {
    return null;
  }
}

function normalizeAgentState(value: AgentSpaceLocalRuntimeAgentState | null, petId: string | null): AgentSpaceLocalRuntimeAgentState {
  return {
    schemaVersion: 1,
    agentId: value?.agentId || "codex-local",
    petId: value?.petId || petId,
    status: value?.status || "idle",
    taskLabel: value?.taskLabel || "本地待机",
    activeTool: value?.activeTool || null,
    updatedAt: value?.updatedAt || new Date().toISOString(),
  };
}

export async function applyLocalRuntime(data: AgentSpaceData): Promise<AgentSpaceLocalRuntime> {
  if (new URLSearchParams(window.location.search).get("localRuntime") === "off") {
    const runtime = fallbackRuntime(false);
    data.localRuntime = runtime;
    window.AGENT_SPACE_LOCAL_RUNTIME = runtime;
    return runtime;
  }

  const manifest = await fetchJson<AgentSpaceLocalRuntimeManifest>(LOCAL_RUNTIME_MANIFEST_URL);
  const activePetId = manifest?.activePetId || null;
  const pet = activePetId ? manifest?.pets?.[activePetId] || null : null;
  const agentStatePayload = await fetchJson<AgentSpaceLocalRuntimeAgentState>(LOCAL_AGENT_STATE_URL);
  const agentState = normalizeAgentState(agentStatePayload, activePetId);
  const runtime: AgentSpaceLocalRuntime = {
    schemaVersion: 1,
    status: pet ? "local-pet" : "fallback",
    manifestPath: LOCAL_RUNTIME_MANIFEST_URL,
    agentStatePath: LOCAL_AGENT_STATE_URL,
    agentStateAvailable: Boolean(agentStatePayload),
    pet,
    agentState,
  };

  if (pet?.spritesheetPath) {
    data.assets.agent = pet.spritesheetPath;
  }
  data.localRuntime = runtime;
  window.AGENT_SPACE_LOCAL_RUNTIME = runtime;
  return runtime;
}
