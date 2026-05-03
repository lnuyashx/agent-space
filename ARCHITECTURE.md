# Agent Space Demo Architecture

This demo is now a transitional version between a static mockup and the future PixiJS game client.

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

- `data/assets.js`: scene backgrounds and character sprite paths
- `data/item-catalog.js`: sellable or system items, such as beds, desks, doors, farm plots, mailbox
- `itemCatalog[].price`: local-demo coin price for shop validation
- `itemCatalog[].visual`: temporary drawing metadata for the static-background prototype
- `data/inventory.js`: what the current user owns
- `data/scenes.js`: the user's home and yard scene data
- `placedObjects`: furniture / fixtures / farm objects placed in each scene
- `walkableRects`: temporary walkable areas for this static-background prototype
- `data/agents.js`: initial agent states
- `data/game-data.js`: compatibility composer that validates required modules and exposes `window.AGENT_SPACE_DATA`
- `localStorage`: current demo persistence for inventory coins, owned items, and placed object item ids

In production these browser script modules should become:

- `items.json`: global item catalog from backend / CDN
- `inventory`: user-owned items from Local Bridge / Hub
- `sceneSnapshot`: user's placed room objects
- `sceneTemplate`: default room slots and allowed placement rules

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

The current demo now draws a temporary object layer between the room background and the agent:

- Decoration changes update `placedObjects[].itemId`.
- The renderer reads `itemCatalog[itemId].visual`.
- Default furniture stays mostly represented by the static background.
- Replaced furniture remains visible as a small pixel-style object marker after leaving decoration mode.

This is intentionally not the final art path. It proves the correct data flow before the project has a furniture sprite atlas. The production equivalent should use:

- `spriteId` / `atlasKey` on the item catalog
- `position`, `depth`, `footprint`, and `collision` on each placed object
- PixiJS sprites with depth sorting instead of canvas placeholder drawing

## Decoration Path

Recommended staging:

1. Slot replacement
   - fixed slots such as `study.desk`, `bedroom.bed`, `living.sofa`
   - safe for V1 monetization and visual consistency
   - current demo implements this as a decoration drawer that updates `placedObjects[].itemId`
   - current demo also lets unowned slot-compatible items be bought with local coins, then added to `inventory.owned`

2. Theme replacement
   - floor, wall, room color, bundled furniture set
   - sold as room theme packs

3. Free placement
   - grid-based drag/drop
   - footprint collision
   - rotation variants
   - depth sorting

## Shop Flow

The current demo models the minimum commerce chain without real payment:

- `itemCatalog` owns price, rarity, category, slot compatibility, and visual metadata.
- `inventory.owned` decides whether a user can equip an item.
- If an item is not owned, the drawer checks the active agent's local coins.
- A successful purchase subtracts coins, writes `inventory.owned[itemId] = 1`, then equips the item into the selected `placedObject`.

Production should replace local coins with backend / wallet validation, but keep the same split between item catalog, inventory, and scene snapshot.

## Persistence

The demo writes a small save object to browser `localStorage`:

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

The current demo should therefore be treated as a visual prototype plus data-model bridge, not as the final rendering architecture.
