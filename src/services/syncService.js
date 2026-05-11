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
            cms_id, code, name, is_active, updated_at, cms_village_id, village_name, cms_cotton_type_id, cotton_type_name
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
          ON CONFLICT (cms_id)
          DO UPDATE SET
            code = EXCLUDED.code,
            name = EXCLUDED.name,
            is_active = EXCLUDED.is_active,
            updated_at = EXCLUDED.updated_at;
        `,
          [
            c.id,
            c.code,
            c.name,
            c.is_active,
            c.updated_at,
            c.cms_village_id,
            c.village_name,
            c.cms_cotton_type_id,
            c.cotton_type_name,
          ],
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

  // =============================
  // SYNC WEIGHBRIDGE (WB → CMS)
  // =============================
  async syncWeighbridge() {
    const SYNC_KEY = "wb_last_sync";

    try {
      const lastSync = await this.getLastSync(SYNC_KEY);

      // safety buffer to avoid missing same-second updates
      const safeSince = lastSync
        ? new Date(new Date(lastSync).getTime() - 2000).toISOString()
        : null;

      const params = [];

      // =========================================
      // ONLY COMPLETED / PROCESSED ORDERS
      // =========================================
      let where = `
        WHERE
          act.activity_type IN (10,20)
          AND act.sw_at IS NOT NULL
          AND act.qty IS NOT NULL
          AND act.gross_weight IS NOT NULL
      `;

      let having = "";

      // =========================================
      // SYNC ONLY NEW/UPDATED RECORDS
      // =========================================
      if (safeSince) {
        params.push(safeSince);

        having = `
          HAVING GREATEST(
            act.updated_at,
            COALESCE(MAX(f_ord.updated_at), act.updated_at)
          ) > $${params.length}
        `;
      }

      const query = `
        SELECT
          act.id AS activity_id,
          act.activity_type,

          -- unified updated_at
          GREATEST(
            act.updated_at,
            COALESCE(MAX(f_ord.updated_at), act.updated_at)
          ) AS updated_at,

          act.created_at,

          ord.id AS delivery_order_id,
          ord.order_number,
          ord.truck_no,

          bc.id AS buying_center_id,
          bc.cms_id AS buying_center_cms_id,
          bc.name AS buying_center_name,

          act.gross_weight,
          act.qty AS net_weight,

          -- bags total
          COALESCE(
            SUM(NULLIF(f_ord.measurement, '')::numeric),
            0
          ) AS total_bags,

          -- amount total
          COALESCE(
            SUM(
              (NULLIF(f_ord.measurement, '')::numeric)
              * COALESCE(f_ord.price_per_unit, 0)
            ),
            0
          ) AS total_amount

        FROM tos_activities act

        INNER JOIN tos_delivery_orders ord
          ON ord.id = act.delivery_order_id

        LEFT JOIN tos_buying_center bc
          ON bc.id = ord.buying_center_id

        LEFT JOIN tos_finished_orders f_ord
          ON f_ord.delivery_order_id = ord.id

        ${where}

        GROUP BY
          act.id,
          ord.id,
          bc.id

        ${having}

        ORDER BY
          updated_at ASC

        LIMIT 500
      `;

      const res = await db.query(query, params);
      const rows = res.rows;

      if (!rows.length) {
        console.log("No WB data to sync");
        return;
      }

      // =========================================
      // SEND IN CHUNKS
      // =========================================
      const chunkSize = 100;

      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);

        await axios.post(
          `${API_URL}/tickets`,
          { data: chunk },
          {
            headers: {
              Authorization: `Bearer ${API_KEY}`,
              Accept: "application/json",
            },
            timeout: 20000,
          },
        );
      }

      // =========================================
      // UPDATE LAST SYNC ONLY AFTER SUCCESS
      // =========================================
      const latestTimestamp = rows[rows.length - 1]?.updated_at;

      if (latestTimestamp) {
        await this.setLastSync(SYNC_KEY, latestTimestamp);
      }

      console.log(`Synced ${rows.length} WB records`);
    } catch (error) {
      console.error(error);
      console.error("WB sync failed:", error.message);
    }
  }
}

module.exports = new SyncService();
