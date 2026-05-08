# Agent Space Architecture

Agent Space is now a transitional version between a static mockup and the future PixiJS game client.

## Direction

The long-term product should use:

- PixiJS rendering
- tile/grid walkable space
- sprite/object layer for furniture and crops
- item catalog + inventory
- placed objects saved per user room
- scene snapshots for neighbor visits

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

## Shop Flow

The current prototype models the minimum commerce chain without real payment:

- `itemCatalog` owns price, rarity, category, slot compatibility, and sprite metadata.
- `inventory.owned` decides whether a user can equip an item.
- If an item is not owned, the drawer checks the active agent's local coins.
- A successful purchase subtracts coins, writes `inventory.owned[itemId] = 1`, then equips the item into the selected `placedObject`.

Production should replace local coins with backend / wallet validation, but keep the same split between item catalog, inventory, and scene snapshot.

## Persistence

The client writes a small save object to browser `localStorage`:

- `inventory.owned`
- `inventory.coins`
- `sceneSnapshot[sceneId].placedObjects[objectId].itemId`

That is only a local prototype stand-in. The production path should store the same shape through Local Bridge / SQLite first, then sync selected scene snapshots through Hub for social visits.

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
