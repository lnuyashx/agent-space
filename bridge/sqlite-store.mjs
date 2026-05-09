import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

const STATE_ROW_ID = 1;

export class BridgeStateStore {
  constructor({ dbPath, schemaVersion, defaultState }) {
    this.schemaVersion = schemaVersion;
    mkdirSync(dirname(dbPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS bridge_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        schema_version INTEGER NOT NULL,
        payload_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    this.selectStmt = this.db.prepare(`
      SELECT schema_version, payload_json, updated_at
      FROM bridge_state
      WHERE id = ?
    `);
    this.insertStmt = this.db.prepare(`
      INSERT INTO bridge_state (id, schema_version, payload_json, updated_at)
      VALUES (?, ?, ?, ?)
    `);
    this.updateStmt = this.db.prepare(`
      UPDATE bridge_state
      SET schema_version = ?, payload_json = ?, updated_at = ?
      WHERE id = ?
    `);

    const existing = this.selectStmt.get(STATE_ROW_ID);
    if (!existing) {
      this.insertStmt.run(
        STATE_ROW_ID,
        schemaVersion,
        JSON.stringify(defaultState),
        new Date().toISOString(),
      );
    }
  }

  readState() {
    const row = this.selectStmt.get(STATE_ROW_ID);
    if (!row) throw new Error("Bridge state row is missing.");
    return {
      schemaVersion: Number(row.schema_version),
      payload: parseJson(row.payload_json),
      savedAt: row.updated_at,
    };
  }

  writeState(nextPayload, nextSchemaVersion = this.schemaVersion) {
    const savedAt = new Date().toISOString();
    this.updateStmt.run(nextSchemaVersion, JSON.stringify(nextPayload), savedAt, STATE_ROW_ID);
    return { schemaVersion: nextSchemaVersion, payload: nextPayload, savedAt };
  }

  resetState(defaultPayload) {
    return this.writeState(defaultPayload, this.schemaVersion);
  }

  close() {
    this.db.close();
  }
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Failed to parse bridge state JSON: ${error.message}`);
  }
}
