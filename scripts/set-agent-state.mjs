import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const rootDir = path.resolve(import.meta.dirname, "..");
const publicRuntimeDir = path.join(rootDir, "public", "local-agent-space");
const manifestPath = path.join(publicRuntimeDir, "pet-manifest.json");
const agentStatePath = path.join(publicRuntimeDir, "agent-state.json");

const statusLabels = {
  idle: "本地待机",
  thinking: "正在思考",
  coding: "正在处理当前任务",
  tool_calling: "正在调用本地工具",
  waiting_user: "等待用户输入",
  error: "需要查看异常",
  done: "任务完成，正在放松",
};

function usage() {
  return [
    "Usage:",
    "  npm run agent:state -- <status> [taskLabel] [activeTool]",
    "",
    "Statuses:",
    `  ${Object.keys(statusLabels).join(", ")}`,
    "",
    "Examples:",
    "  npm run agent:state -- coding",
    "  npm run agent:state -- tool_calling 正在运行命令 terminal",
    "  npm run agent:state -- waiting_user 等待你确认",
  ].join("\n");
}

async function readJson(filePath) {
  if (!existsSync(filePath)) return null;
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function main() {
  const [status, taskLabel, activeTool] = process.argv.slice(2);

  if (!status || status === "--help" || status === "-h") {
    console.log(usage());
    process.exitCode = status ? 0 : 1;
    return;
  }

  if (status === "--list") {
    console.log(Object.keys(statusLabels).join("\n"));
    return;
  }

  if (!statusLabels[status]) {
    console.error(`Unknown agent status "${status}".`);
    console.error(usage());
    process.exitCode = 1;
    return;
  }

  const [manifest, existingState] = await Promise.all([
    readJson(manifestPath),
    readJson(agentStatePath),
  ]);
  const petId = existingState?.petId || manifest?.activePetId || null;
  const state = {
    schemaVersion: 1,
    agentId: existingState?.agentId || "codex-local",
    petId,
    status,
    taskLabel: taskLabel || statusLabels[status],
    activeTool: activeTool || null,
    updatedAt: new Date().toISOString(),
  };

  await mkdir(publicRuntimeDir, { recursive: true });
  await writeFile(agentStatePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  console.log(`Agent state updated: ${path.relative(rootDir, agentStatePath)}`);
  console.log(`${state.status}: ${state.taskLabel}${state.activeTool ? ` · ${state.activeTool}` : ""}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
