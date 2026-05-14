# Local Codex Pet Room Phase-One Plan

Language: [中文](local-pet-room-plan.zh-CN.md) | English

## Goal

Phase one builds a local Codex pet / agent 2.5D visual living space, not an online home game.

It must deliver:

- First-start import of local Codex pet visual assets.
- A pet rendered in the room, with animation and behavior anchors driven by abstract agent state.
- Local room background, theme bundle, and individual furniture switching.
- Local `backgroundId` switching plus a first placement pass for the selected furniture item, persisted as `placement`.
- Local persistence across refresh.
- No coin purchase flow, real shop, payment, account system, or multiplayer.

## First Sync

Local run flow:

```sh
npm install
npm run setup:local
npm run dev
```

`npm run dev` runs `setup:local` first.

`setup:local` does this:

1. Scan `$CODEX_HOME/pets`, falling back to `~/.codex/pets`.
2. Find the first Codex pet with `pet.json` and a spritesheet.
3. Copy pet assets into `public/local-agent-space/pets/<pet-id>/`.
4. Generate `public/local-agent-space/pet-manifest.json`.
5. Create `public/local-agent-space/agent-state.json` if it does not exist.

`public/local-agent-space/` is ignored by git and is only for local runtime files.

## Sync Boundary

Phase one syncs pet visuals and an abstract state channel.

It reads:

- pet id
- pet displayName
- pet description
- pet spritesheet
- abstract agent state: `idle` / `thinking` / `coding` / `tool_calling` / `waiting_user` / `error` / `done`
- optional tool name, such as `terminal`

It does not read:

- chat content
- private memory
- local file content
- terminal output details
- Codex internal logs

## State File

The first state entry is:

```text
public/local-agent-space/agent-state.json
```

Example:

```json
{
  "schemaVersion": 1,
  "agentId": "codex-local",
  "petId": "kikyo",
  "status": "coding",
  "taskLabel": "Processing the current task",
  "activeTool": "terminal",
  "updatedAt": "2026-05-12T00:00:00.000Z"
}
```

The frontend polls this file and maps state to room behavior.

For local debugging, write the state file directly:

```sh
npm run agent:state -- coding
npm run agent:state -- tool_calling "Running a command" terminal
npm run agent:state -- waiting_user "Waiting for confirmation"
```

The in-drawer Agent State buttons are frontend previews only; they do not write the file. The File button returns to `agent-state.json` sync.

## State Mapping

| agent state | pet animation | room anchor |
|---|---|---|
| `idle` | `idle` | sofa / idle point |
| `thinking` | `review` | bookshelf |
| `coding` | `running` | work desk |
| `tool_calling` | `running` | work desk |
| `waiting_user` | `waiting` | door |
| `error` | `failed` | work desk |
| `done` | `waving` | sofa / relaxing point |

If no local Codex pet is available, the frontend uses the built-in agent asset.

## Mature Components

Phase one keeps the current project foundation:

- PixiJS for the formal 2.5D renderer.
- Codex pet spritesheets for the first local pet visual.
- Tiled/LDtk-style object layers for future room, furniture, behavior-anchor, and collision data.

Reldens / Colyseus are not introduced in phase one because multiplayer is not the current target.
