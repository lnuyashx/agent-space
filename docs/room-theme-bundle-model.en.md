# Room Theme And Furniture Bundle Model

This document defines the V1 data model for room themes and furniture bundles. Earlier versions framed this as decoration commerce; phase one now treats customization as locally unlocked, so `price`, `saleMode`, and ownership fields are compatibility hooks and future product experiments, not the P1 purchase flow.

## Data Entry

- `data/theme-bundles.js` exposes `window.AGENT_SPACE_DATA.themeBundles`
- `themes` define room theme identity, style tokens, compatible slots, and renderer dependencies
- `bundles` define sellable furniture packs, granted items, default equip plans, and duplicate-purchase policy
- The current implementation defines the model only; it does not change the existing settings drawer UI

## Theme Fields

A theme must include:

- `id`: stable theme id, such as `oceanFocus`
- `label`: display name
- `sceneId`: target scene, currently `indoor`
- `rarity` / `price` / `saleMode`: commerce display and sale fields
- `styleTokens`: wall, floor, trim, rug, lighting, and accent tokens
- `compatibleSlots`: furniture slots covered by the theme
- `rendererRequirements`: separate requirements for the current static demo and future PixiJS renderer

A theme is not just a background image name. Production should split theme visuals into wall, floor, lighting, decoration, and furniture sprite variants.

## Bundle Fields

A furniture bundle must include:

- `id` / `label`
- `themeId`
- `sceneId`
- `rarity` / `price` / `saleMode`
- `grantItems`: item ids added to inventory after purchase
- `equipPlan`: recommended `placedObjectId -> itemId` mapping
- `ownership`: unlock and duplicate-purchase policy

`equipPlan` is a recommendation, not the only valid state. Players can equip only part of a bundle or continue replacing individual slots.

## Ownership And Equip Flow

V1 flow:

1. `locked`: can preview and purchase
2. `owned`: theme and bundle items are in inventory; the bundle can be equipped as a set or item-by-item
3. `equipped`: `sceneSnapshot[sceneId].themeId` points to the theme and `placedObjects` store equipped item ids

Purchase writes:

- `inventory.ownedBundles[bundleId]`
- `inventory.ownedThemes[themeId]`
- `inventory.owned[itemId]`

Equip writes:

- `sceneSnapshot[sceneId].themeId`
- `sceneSnapshot[sceneId].placedObjects[objectId].itemId`

## Renderer And Data Dependencies

The current static-background demo cannot truly replace walls or floors, so theme ownership can enter the data and commerce model first while visible changes remain focused on bundled furniture.

Production PixiJS needs:

- room surface layers: wall, floor, trim, rug, lighting
- furniture sprite atlas variants
- theme preview thumbnails or scene preview snapshots
- `sceneSnapshot.themeId` persistence
- neighbor visits reading the owner's equipped theme and placed furniture

## Deferred

- Real payment and backend grant delivery
- Theme shard or duplicate-compensation economy
- Free try-on and limited-time themes
- Theme animation, weather, window views, and seasonal decorations
