// Composes browser-loaded data modules into the legacy app data entrypoint.
(function () {
  const modules = window.AGENT_SPACE_DATA_MODULES || {};
  const requiredModules = ["assets", "itemCatalog", "inventory", "scenes", "agents", "farm", "themeBundles"];
  const missingModules = requiredModules.filter((key) => !modules[key]);

  if (missingModules.length) {
    throw new Error(`Agent Space data modules missing: ${missingModules.join(", ")}`);
  }

  window.AGENT_SPACE_DATA = {
    assets: modules.assets,
    itemCatalog: modules.itemCatalog,
    inventory: modules.inventory,
    scenes: modules.scenes,
    agents: modules.agents,
    farm: modules.farm,
    themeBundles: modules.themeBundles,
  };
})();
