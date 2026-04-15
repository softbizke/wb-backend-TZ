const { Pool } = require("pg");
const { dbConfig } = require("../config/dbConfig");
const { default: axios } = require("axios");
const {
  WEIGHBRIDGE_CMS_API_URL,
  WEIGHBRIDGE_CMS_API_KEY,
} = require("../config/configs");

// Create a connection pool
const db = new Pool({
  user: dbConfig.user,
  host: dbConfig.host,
  database: dbConfig.database,
  password: dbConfig.password,
  port: dbConfig.port,
});

const API_URL = WEIGHBRIDGE_CMS_API_URL + "/wb";
const API_KEY = WEIGHBRIDGE_CMS_API_KEY;

class SyncService {
  // =============================
  // GET LAST SYNC
  // =============================
  async getLastSync(key) {
    const res = await db.query(
      `SELECT value FROM tos_sync_meta WHERE key = $1`,
      [key],
    );

    return res.rows[0]?.value || null;
  }

  // =============================
  // SET LAST SYNC
  // =============================
  async setLastSync(key, value) {
    await db.query(
      `
      INSERT INTO tos_sync_meta (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value;
    `,
      [key, value],
    );
  }

  // =============================
  // SYNC DRIVERS
  // =============================
  async syncDrivers() {
    try {
      const lastSync = await this.getLastSync("drivers_last_sync");

      let url = `${API_URL}/drivers`;
      if (lastSync) {
        url += `?since=${encodeURIComponent(lastSync)}`;
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: "Bearer " + API_KEY,
          Accept: "application/json",
        },
      });

      const drivers = response.data.data;

      if (!drivers.length) {
        console.log("No new drivers to sync");
        return;
      }

      let latestTimestamp = lastSync;

      for (const d of drivers) {
        await db.query(
          `
          INSERT INTO tos_drivers (
            cms_id, code, name, license_no, phone, id_no,
            email, address, is_active, updated_at
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
          ON CONFLICT (cms_id)
          DO UPDATE SET
            code = EXCLUDED.code,
            name = EXCLUDED.name,
            license_no = EXCLUDED.license_no,
            phone = EXCLUDED.phone,
            id_no = EXCLUDED.id_no,
            email = EXCLUDED.email,
            address = EXCLUDED.address,
            is_active = EXCLUDED.is_active,
            updated_at = EXCLUDED.updated_at;
        `,
          [
            d.id,
            d.code,
            d.name,
            d.license_no,
            d.phone,
            d.id_no,
            d.email,
            d.address,
            d.is_active,
            d.updated_at,
          ],
        );

        // track latest timestamp
        if (!latestTimestamp || d.updated_at > latestTimestamp) {
          latestTimestamp = d.updated_at;
        }
      }

      // ✅ Save sync AFTER success
      if (latestTimestamp) {
        await this.setLastSync("drivers_last_sync", latestTimestamp);
      }

      console.log(`Synced ${drivers.length} drivers`);
    } catch (error) {
      console.error("Driver sync failed:", error.message);
    }
  }

  // =============================
  // SYNC BUYING CENTERS
  // =============================
  async syncBuyingCenters() {
    try {
      const lastSync = await this.getLastSync("bc_last_sync");

      let url = `${API_URL}/buying-centers`;
      if (lastSync) {
        url += `?since=${encodeURIComponent(lastSync)}`;
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: "Bearer " + API_KEY,
          Accept: "application/json",
        },
      });

      const centers = response.data.data;

      if (!centers.length) {
        console.log("No new buying centers to sync");
        return;
      }

      let latestTimestamp = lastSync;

      for (const c of centers) {
        await db.query(
          `
          INSERT INTO tos_buying_center (
            cms_id, code, name, is_active, updated_at
          )
          VALUES ($1,$2,$3,$4,$5)
          ON CONFLICT (cms_id)
          DO UPDATE SET
            code = EXCLUDED.code,
            name = EXCLUDED.name,
            is_active = EXCLUDED.is_active,
            updated_at = EXCLUDED.updated_at;
        `,
          [c.id, c.code, c.name, c.is_active, c.updated_at],
        );

        if (!latestTimestamp || c.updated_at > latestTimestamp) {
          latestTimestamp = c.updated_at;
        }
      }

      if (latestTimestamp) {
        await this.setLastSync("bc_last_sync", latestTimestamp);
      }

      console.log(`Synced ${centers.length} buying centers`);
    } catch (error) {
      console.error("Buying center sync failed:", error.message);
      console.error(error);
    }
  }
}

module.exports = new SyncService();
