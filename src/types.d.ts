export {};

declare global {
  interface Window {
    AGENT_SPACE_DATA?: AgentSpaceData;
    AGENT_SPACE_LOCAL_RUNTIME?: AgentSpaceLocalRuntime;
    AGENT_SPACE_READY?: boolean;
    __AGENT_SPACE_PIXI__?: unknown;
  }
}

export interface AgentSpaceData {
  assets: {
    agent: string;
    scenes: Record<string, string>;
    atlases?: Record<string, AgentSpaceAtlas>;
  };
  localRuntime?: AgentSpaceLocalRuntime;
  itemCatalog: Record<string, AgentSpaceItem>;
  inventory: {
    owned: Record<string, number>;
    coins: number;
  };
  scenes: Record<string, AgentSpaceScene>;
  agents: Record<string, AgentSpaceAgent>;
}

export interface AgentSpaceItem {
  type: string;
  category: string;
  label: string;
  rarity: string;
  price: number;
  slots?: string[];
  actions?: string[];
  sprite?: {
    atlasKey: string;
    spriteId: string;
    anchor: AgentSpacePoint;
    fallback?: {
      kind: string;
      color: string;
      accent: string;
      short: string;
      variant?: string;
    };
  };
}

export interface AgentSpaceScene {
  assetId: string;
  decoratingAssetId?: string;
  backgroundOptions?: AgentSpaceRoomBackground[];
  status: string;
  hash: string;
  entry: AgentSpacePoint;
  placedObjects: Record<string, AgentSpacePlacedObject>;
  walkableRects: AgentSpaceRect[];
}

export interface AgentSpaceRoomBackground {
  id: string;
  label: string;
  assetId: string;
  decoratingAssetId?: string;
  description?: string;
}

export interface AgentSpaceAgent {
  title: string;
  mood: number;
  energy: number;
  exp: number;
  skills: Record<string, number>;
  initialObject?: {
    scene: string;
    objectId: string;
    status: string;
  };
}

export interface AgentSpacePlacedObject {
  itemId: string;
  defaultItemId?: string;
  interactionPoint?: AgentSpacePoint;
  farmPlotId?: string;
  defaultFarmStateId?: string;
  room?: string;
  slot: string;
  type: string;
  label: string;
  point: AgentSpacePoint;
  hitAreas?: AgentSpaceShape[];
  renderRect?: AgentSpaceRect;
  rect?: AgentSpaceRect;
  polygon?: AgentSpacePoint[];
  preview?: string;
  real?: string;
  bubble?: string;
  to?: string;
}

export interface AgentSpacePoint {
  x: number;
  y: number;
}

export interface AgentSpaceRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface AgentSpaceAtlas {
  key: string;
  image: string;
  imageSize?: AgentSpaceFrameSize;
  frameSize?: AgentSpaceFrameSize;
  frames?: Record<string, AgentSpaceRect>;
  status?: string;
}

export interface AgentSpaceFrameSize {
  w: number;
  h: number;
}

export interface AgentSpaceLocalRuntime {
  schemaVersion: number;
  status: "local-pet" | "fallback";
  manifestPath: string;
  agentStatePath: string;
  agentStateAvailable: boolean;
  pet: AgentSpaceLocalRuntimePet | null;
  agentState: AgentSpaceLocalRuntimeAgentState;
}

export interface AgentSpaceLocalRuntimeManifest {
  schemaVersion: number;
  generatedAt?: string;
  sourceCodexHome?: string;
  activePetId: string | null;
  pets: Record<string, AgentSpaceLocalRuntimePet>;
}

export interface AgentSpaceLocalRuntimePet {
  id: string;
  displayName: string;
  description?: string;
  spritesheetPath: string;
  source?: string;
  frameGrid?: AgentSpacePetFrameGrid;
  stateToAnimation?: Record<string, string>;
}

export interface AgentSpacePetFrameGrid {
  columns: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  states: Record<string, AgentSpacePetAnimationRow>;
}

export interface AgentSpacePetAnimationRow {
  row: number;
  frames: number;
  durations: number[];
}

export interface AgentSpaceLocalRuntimeAgentState {
  schemaVersion: number;
  agentId: string;
  petId: string | null;
  status: string;
  taskLabel: string;
  activeTool: string | null;
  updatedAt: string;
}

export type AgentSpaceShape =
  | ({ type: "rect" } & AgentSpaceRect)
  | { type: "polygon"; points: AgentSpacePoint[] }
  | { type: "ellipse"; x?: number; y?: number; w?: number; h?: number; cx?: number; cy?: number; rx?: number; ry?: number };
