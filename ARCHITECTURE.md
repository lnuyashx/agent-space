# Agent Space Architecture

Agent Space is now a transitional version between a static mockup and the future PixiJS game client.

## Direction

The phase-one product target is a local Codex pet / agent visual living space. Pet visuals can be imported from the user's local Codex pet package, while runtime status comes through an Agent Space adapter (`agent-state.json` first, richer adapters later). The first stage does not require a cloud backend, accounts, multiplayer, or a coin economy.

The long-term product should use:

- PixiJS rendering
- tile/grid walkable space
- sprite/object layer for furniture and crops
- item catalog + local customization state
- placed objects saved per user room
- scene snapshots for neighbor visits
- local agent state adapters before cloud sync

The current canvas demo keeps the static background for visual speed, but the interaction data has been moved into `data/` modules so the model already matches the future architecture.

## Data Layers

The current browser data entrypoint is still `window.AGENT_SPACE_DATA`, but it is composed from smaller classic-script modules:

- `data/assets.js`: scene backgrounds, character sprite paths, and sprite atlas manifests starting with `prototype-furniture`
- `data/item-catalog.js`: sellable or system items, such as beds, desks, doors, farm plots, mailbox
- `itemCatalog[].price`: local-demo coin price for shop validation
- `itemCatalog[].sprite`: sprite atlas identity plus fallback drawing metadata for the static-background prototype
- `data/inventory.js`: what the current user owns
- `data/scenes.js`: the user's home and yard scene data
- `placedObjects`: furniture / fixtures / farm objects placed in each scene
- `walkableRects`: temporary walkable areas for this static-background prototype
- `data/agents.js`: initial agent states
- `data/farm-model.js`: crop lifecycle, plot snapshot shape, owner actions, neighbor actions, and social sync rules
- `data/theme-bundles.js`: room theme fields, furniture bundle grants, ownership/equip flow, and renderer/data dependencies
- `public/local-agent-space/pet-manifest.json`: generated local Codex pet visual manifest, ignored by git
- `public/local-agent-space/agent-state.json`: generated first-stage local agent status input, ignored by git
- `data/game-data.js`: compatibility composer that validates required modules and exposes `window.AGENT_SPACE_DATA`
- `localStorage`: current demo persistence for inventory coins, owned items, and placed object item ids

In production these browser script modules should become:

- `items.json`: global item catalog from backend / CDN
- `inventory`: user-owned items from Local Bridge / Hub
- `sceneSnapshot`: user's placed room objects
- `sceneTemplate`: default room slots and allowed placement rules
- `farmSnapshot`: plot state keyed by stable `farmPlotId`
- `themeCatalog` / `bundleCatalog`: sellable themes and furniture packs
- `sceneSnapshot.themeId`: equipped room theme id
- `agentState`: local Codex / agent status, tool hint, pet id, and task label
- `petManifest`: local pet visuals and animation mapping

## Placed Object Shape

Each placed object is the bridge between art and gameplay:

```js
{
  itemId: "computer_desk_basic",
  room: "study",
  slot: "study.desk",
  type: "preview",
  label: "电脑桌",
  point: { x: 0.62, y: 0.4 },
  hitAreas: [
    {
      type: "polygon",
      points: [
        { x: 0.56, y: 0.25 },
        { x: 0.73, y: 0.18 },
        { x: 0.8, y: 0.28 },
        { x: 0.73, y: 0.39 },
        { x: 0.57, y: 0.37 },
        { x: 0.53, y: 0.29 }
      ]
    }
  ],
  bubble: "电脑前才是真正的工作点位"
}
```

For the current background-image prototype:

- `hitAreas` are clickable shapes that match the visible art object, not the whole room area.
- A complex object can combine several shapes, such as a desk polygon plus a monitor rect.
- `point` is where the agent stands when interacting.
- `type` decides behavior: `preview`, `navigate`, or `yard`.

For PixiJS production:

- `hitAreas` should become object-local hit areas or sprite alpha masks.
- `point` should become interaction anchor.
- `slot` becomes the first version of decoration replacement.
- later `position + footprint + collision` can enable free placement.

## Temporary Object Layer

The current client now draws a temporary object layer between the room background and the agent:

- Decoration changes update `placedObjects[].itemId`.
- The renderer reads `itemCatalog[itemId].sprite`.
- Default furniture stays mostly represented by the static background.
- Decoration mode can swap the scene background through `scenes[].decoratingAssetId`, so the indoor scene uses an empty-room prototype background while independent furniture sprites are drawn on top.
- Replaced furniture remains visible as a small pixel-style object marker after leaving decoration mode.

This is intentionally not the final art path. It proves the correct data flow before the project has a furniture sprite atlas. The current sprite metadata shape is:

- `atlasKey`: atlas manifest key, currently `prototype-furniture`
- `spriteId`: stable item-frame identity, for example `desk.dual_monitor`
- `anchor`: normalized sprite anchor, ready for PixiJS placement
- `fallback`: color/kind metadata for the canvas placeholder while real art is missing

The first prototype atlas lives at `assets/furniture-prototype-atlas.svg`. It is intentionally simple independent object art so the renderer can prove atlas-frame resolution before production sprites exist. The matching empty-room prototype background lives at `assets/scene-indoor-empty-prototype.svg`; it only removes baked-in furniture during decoration mode and is not production room art.

The production equivalent should use:

- real `atlasKey` entries under `assets.atlases`
- `spriteId` frames resolved from a PixiJS texture atlas
- `position`, `depth`, `footprint`, and `collision` on each placed object
- PixiJS sprites with depth sorting instead of canvas placeholder drawing

## Decoration Path

Recommended staging:

1. Slot replacement
   - fixed slots such as `study.desk`, `bedroom.bed`, `living.sofa`
   - safe for V1 monetization and visual consistency
   - current client implements this as a decoration drawer that updates `placedObjects[].itemId`
   - current client also lets unowned slot-compatible items be bought with local coins, then added to `inventory.owned`

2. Theme replacement
   - floor, wall, room color, bundled furniture set
   - sold as room theme packs

3. Free placement
   - grid-based drag/drop
   - footprint collision
   - rotation variants
   - depth sorting

## Local Customization Flow

The previous prototype modeled a local coin shop. Phase one treats customization as local and unlocked:

- `itemCatalog` still owns rarity, category, slot compatibility, and sprite metadata.
- `price` remains only as a compatibility field for older save tests and future product experiments.
- The drawer can equip compatible local items directly without coin checks.
- A furniture change writes `sceneSnapshot[sceneId].placedObjects[objectId].itemId`.
- A theme or bundle change writes `sceneSnapshot[sceneId].themeId` plus compatible placed-object item ids.

Commerce can return later as a product layer, but it is not part of phase one.

## Persistence

The client writes a small save object to browser `localStorage`:

- `inventory.owned`
- `inventory.coins`
- `sceneSnapshot[sceneId].placedObjects[objectId].itemId`
- `sceneSnapshot[sceneId].themeId`

That is only a local prototype stand-in. Phase one also reads generated local runtime files under `public/local-agent-space/`:

- `pet-manifest.json`: imported Codex pet visual assets
- `agent-state.json`: abstract local agent status such as `idle`, `thinking`, `coding`, `tool_calling`, `waiting_user`, `error`, or `done`

The production path can later store the same shape through Local Bridge / SQLite first, then sync selected scene snapshots through Hub for social visits.

The repository now includes a Local Bridge v0.1 backend bootstrap under `bridge/`:

- transport: WebSocket (`/bridge`)
- persistence: SQLite (`bridge/.runtime/agent-space-bridge.sqlite`)
- protocol doc: `docs/asp-v0.1.zh-CN.md` and `docs/asp-v0.1.en.md`
- minimum methods: `ping`, `snapshot.get`, `snapshot.save`, `inventory.buy`, `scene.equip`, `farm.action`, `save.reset`

The current Web client uses `localStorage` by default. The bridge adapter can still be tested explicitly with a `bridge` URL query parameter.

For phase one, the bridge is optional. It should not be treated as a required backend for showing the local pet room.

## Why Not Static Background Long Term

Static backgrounds are good for proving mood and layout, but weak for:

- selling individual furniture
- replacing room style
- showing each neighbor's unique home
- farm upgrades and crop state
- object collision and animation
- furniture drag/drop

The current client should therefore be treated as a visual prototype plus data-model bridge, not as the final rendering architecture.

## Farm Plot Model

The yard farm model is intentionally data-first. `data/farm-model.js` defines:

- lifecycle states: `empty`, `seeded`, `growing`, `ready`, `withered`
- owner actions: `plant`, `water`, `fertilize`, `harvest`, `clear`
- neighbor actions: `help_water`, `steal`
- crop metadata for starter crops
- a default plot snapshot shape for later persistence

Current yard fields in `data/scenes.js` only map visual objects to stable `farmPlotId` values. Future gameplay should save farm progress by `farmPlotId`, not by canvas coordinates or temporary hit-area geometry.

## Theme And Bundle Model

The room theme model is also data-first. `data/theme-bundles.js` defines:

- theme fields: `id`, `sceneId`, `styleTokens`, compatible slots, and renderer requirements
- furniture bundles that grant catalog items and carry a recommended `equipPlan`
- ownership states: `locked`, `owned`, `equipped`
- purchase writes to `ownedBundles`, `ownedThemes`, and item inventory
- equip writes to `sceneSnapshot[sceneId].themeId` and compatible `placedObjects`

The current static background cannot render wall/floor theme swaps yet. Production PixiJS needs surface layers, preview snapshots, and sprite atlas variants before themes can become fully visual.
