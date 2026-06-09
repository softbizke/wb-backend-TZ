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
  constructor() {
    this.isRunning = false;
  }

  // =============================
  // SYNC ALL
  // =============================
  async syncAll(source = "Manual") {
    if (this.isRunning) {
      console.log("Skipping sync, already running...");
      return {
        success: false,
        skipped: true,
        message: "Sync already running",
      };
    }

    this.isRunning = true;
    const startedAt = new Date().toISOString();

    try {
      console.log(`${source} sync running...`);
      await this.syncDrivers();
      await this.syncBuyingCenters();
      await this.syncWeighbridge();

      return {
        success: true,
        skipped: false,
        message: "Sync completed",
        startedAt,
        finishedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`${source} sync error:`, error.message);
      return {
        success: false,
        skipped: false,
        message: "Sync failed",
        error: error.message,
        startedAt,
        finishedAt: new Date().toISOString(),
      };
    } finally {
      this.isRunning = false;
    }
  }

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
            cms_id, code, name, distance, is_active, updated_at, cms_zone_id, zone_name, cms_cotton_type_id, cotton_type_name
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
          ON CONFLICT (cms_id)
          DO UPDATE SET
            code = EXCLUDED.code,
            name = EXCLUDED.name,
            distance = EXCLUDED.distance,
            is_active = EXCLUDED.is_active,
            updated_at = EXCLUDED.updated_at,
            cms_zone_id = EXCLUDED.cms_zone_id,
            zone_name = EXCLUDED.zone_name,
            cms_cotton_type_id = EXCLUDED.cms_cotton_type_id,
            cotton_type_name = EXCLUDED.cotton_type_name;
        `,
          [
            c.id,
            c.code,
            c.name,
            c.distance,
            c.is_active,
            c.updated_at,
            c.cms_zone_id,
            c.zone_name,
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
  // ONE-TIME BUYING CENTER UPDATE
  // Updates existing buying centers from CMS changes since Jan 1, 2026.
  // If uncommented, this fetches updated buying centers from CMS and updates
  // existing local rows by cms_id, including zone/village fields and distance.
  // =============================
  // async manualUpdateBuyingCentersFrom2026() {
  //   const since = "2026-01-01T00:00:00.000Z";
  //
  //   try {
  //     const response = await axios.get(
  //       `${API_URL}/buying-centers?since=${encodeURIComponent(since)}`,
  //       {
  //         headers: {
  //           Authorization: "Bearer " + API_KEY,
  //           Accept: "application/json",
  //         },
  //       },
  //     );
  //
  //     const centers = response.data.data || [];
  //
  //     if (!centers.length) {
  //       console.log("No buying centers returned for manual update");
  //       return {
  //         success: true,
  //         message: "No buying centers returned for manual update",
  //         since,
  //         received: 0,
  //         updated: 0,
  //         missing: [],
  //       };
  //     }
  //
  //     const columns = await this.getBuyingCenterColumns();
  //     const missing = [];
  //     let updated = 0;
  //
  //     for (const center of centers) {
  //       const updateFields = [];
  //       const values = [];
  //       const zoneId = center.cms_zone_id ?? center.cms_village_id;
  //       const zoneName = center.zone_name ?? center.village_name;
  //
  //       const addUpdateField = (column, value) => {
  //         if (!columns.has(column)) return;
  //
  //         values.push(value);
  //         updateFields.push(`${column} = $${values.length}`);
  //       };
  //
  //       addUpdateField("code", center.code);
  //       addUpdateField("name", center.name);
  //       addUpdateField("distance", center.distance);
  //       addUpdateField("is_active", center.is_active);
  //       addUpdateField("isactive", center.is_active);
  //       addUpdateField("updated_at", center.updated_at);
  //
  //       // Some DB versions call these CMS zone fields "village" fields.
  //       addUpdateField("cms_zone_id", zoneId);
  //       addUpdateField("zone_name", zoneName);
  //       addUpdateField("cms_village_id", zoneId);
  //       addUpdateField("village_name", zoneName);
  //
  //       addUpdateField("cms_cotton_type_id", center.cms_cotton_type_id);
  //       addUpdateField("cotton_type_name", center.cotton_type_name);
  //
  //       if (!updateFields.length) {
  //         continue;
  //       }
  //
  //       values.push(center.id);
  //
  //       const result = await db.query(
  //         `
  //         UPDATE tos_buying_center
  //         SET ${updateFields.join(", ")}
  //         WHERE cms_id = $${values.length}
  //       `,
  //         values,
  //       );
  //
  //       if (result.rowCount > 0) {
  //         updated += result.rowCount;
  //       } else {
  //         missing.push({
  //           cms_id: center.id,
  //           name: center.name,
  //         });
  //       }
  //     }
  //
  //     console.log(
  //       `Manual buying center update complete. Received ${centers.length}, updated ${updated}`,
  //     );
  //
  //     return {
  //       success: true,
  //       message: "Manual buying center update completed",
  //       since,
  //       received: centers.length,
  //       updated,
  //       missing,
  //     };
  //   } catch (error) {
  //     console.error("Manual buying center update failed:", error.message);
  //     return {
  //       success: false,
  //       message: "Manual buying center update failed",
  //       error: error.message,
  //       since,
  //     };
  //   }
  // }
  //
  // async getBuyingCenterColumns() {
  //   const result = await db.query(
  //     `
  //     SELECT column_name
  //     FROM information_schema.columns
  //     WHERE table_schema = 'public'
  //       AND table_name = 'tos_buying_center'
  //   `,
  //   );
  //
  //   return new Set(result.rows.map((row) => row.column_name));
  // }

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

      //Note: We will only push tickets to CMS only if product is seed cotton or product id is 18
      let where = `
        WHERE
          act.activity_type IN (10,20)
          AND act.sw_at IS NOT NULL
          AND act.qty IS NOT NULL
          AND act.gross_weight IS NOT NULL
          AND bc.cms_id IS NOT NULL
          AND (
            product.id = 18
            OR TRIM(LOWER(product.name)) = 'seed cotton'
          )
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

          ord.created_at,

          ord.id AS delivery_order_id,
          ord.order_number,
          ord.truck_no,
          ord.trailler_no,
          ord.vessel_id,
          ord.old_truck_no,
          ord.isactive,
          ord.do_no,
          ord.order_type,
          ord.driver_id,
          ord.customer_id,
          ord.supplier_id,
          ord.transporter_id,
          ord.purchase_type_id,
          ord.dispatch_type_id,

          bc.id AS buying_center_id,
          bc.cms_id AS buying_center_cms_id,
          bc.name AS buying_center_name,

          jsonb_build_object(
            'id', drv.id,
            'name', drv.name,
            'license_no', drv.license_no,
            'id_no', drv.id_no
          ) AS driver,

          jsonb_build_object(
            'id', cust.id,
            'name', cust.name,
            'bp_code', cust.bp_code
          ) AS customer,

          jsonb_build_object(
            'id', supp.id,
            'name', supp.name,
            'phone_number', supp.phone_number
          ) AS supplier,

          jsonb_build_object(
            'id', trans.id,
            'title', trans.title
          ) AS transporter,

          jsonb_build_object(
            'id', bc.id,
            'title', bc.name,
            'village', bc.village_name,
            'cotton_type', bc.cotton_type_name
          ) AS buying_center,

          jsonb_build_object(
            'id', pt.id,
            'title', pt.title
          ) AS purchase_type,

          jsonb_build_object(
            'id', dt.id,
            'title', dt.title
          ) AS dispatch_type,

          jsonb_build_object(
            'id', packty.id,
            'name', packty.name
          ) AS packing_type,

          act.gross_weight,
          act.qty AS net_weight,

          COALESCE(
            json_agg(
              jsonb_build_object(
                'quantity', f_ord.measurement,
                'price_per_unit', COALESCE(f_ord.price_per_unit::numeric, 0),
                'total_amount',
                  COALESCE(f_ord.price_per_unit::numeric, 0)
                  * COALESCE(NULLIF(f_ord.measurement, '')::numeric, 0),
                'name', product.name,
                'id', product.id,
                'sku', product.item_code,
                'unit', f_ord.unit,
                'transaction_type', f_ord.transaction_type,
                'source', f_ord.source,
                'destination', COALESCE(dest.title, f_ord.destination::text),
                'destination_id', dest.id,
                'destination_type', dest.type,
                'destination_details', jsonb_build_object(
                  'id', dest.id,
                  'title', dest.title,
                  'type', dest.type
                ),
                'measurement', f_ord.measurement
              )
            ) FILTER (WHERE f_ord.id IS NOT NULL),
            '[]'::json
          ) AS products,

          sw_ap.name AS sw_wb,
          fw_ap.name AS fw_wb,
          act10.delivery_order_id AS order10_id,
          act10.truck_no AS truck_no_10,
          act10.images,
          act10.tare_weight,
          act10.gross_weight AS gross_weight_10,
          act10.qty AS net_weight_10,
          act10.id AS activity10_id,
          act10.created_at AS created10_at,
          act10.sw_at AS sw10_at,
          act10.fw_by AS fw10_by,
          act10.sw_by AS sw10_by,
          act10.avrg_w AS avrg_w,
          act10.reason AS reason,
          act10.sw_truck_no AS sw_truck_no,

          jsonb_build_object(
            'id', fw10_user.id,
            'name', CONCAT(fw10_user.first_name, ' ', fw10_user.last_name),
            'phone', fw10_user.phone
          ) AS fw10_user,

          jsonb_build_object(
            'id', sw10_user.id,
            'name', CONCAT(sw10_user.first_name, ' ', sw10_user.last_name),
            'phone', sw10_user.phone
          ) AS sw10_user,

          act20.delivery_order_id AS order20_id,
          act20.gross_weight AS gross_weight_20,
          act20.qty AS net_weight_20,
          act20.created_at AS created20_at,
          act20.id AS activity20_id,
          act20.sw_at AS sw20_at,
          act20.fw_by AS fw20_by,
          act20.sw_by AS sw20_by,
          act20.avrg_w AS avrg_w_20,

          jsonb_build_object(
            'id', fw20_user.id,
            'name', CONCAT(fw20_user.first_name, ' ', fw20_user.last_name),
            'phone', fw20_user.phone
          ) AS fw20_user,

          jsonb_build_object(
            'id', sw20_user.id,
            'name', CONCAT(sw20_user.first_name, ' ', sw20_user.last_name),
            'phone', sw20_user.phone
          ) AS sw20_user,

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

        INNER JOIN tos_buying_center bc
          ON bc.id = ord.buying_center_id

        LEFT JOIN tos_finished_orders f_ord
          ON f_ord.delivery_order_id = ord.id

        INNER JOIN tos_product product
          ON product.id = f_ord.product_id

        LEFT JOIN tos_destinations dest
          ON dest.id::text = f_ord.destination::text

        LEFT JOIN tos_activities act10
          ON ord.id = act10.delivery_order_id AND act10.activity_type = 10

        LEFT JOIN tos_activities act20
          ON ord.id = act20.delivery_order_id AND act20.activity_type = 20

        LEFT JOIN tos_users fw10_user ON fw10_user.id = act10.fw_by
        LEFT JOIN tos_users sw10_user ON sw10_user.id = act10.sw_by
        LEFT JOIN tos_users fw20_user ON fw20_user.id = act20.fw_by
        LEFT JOIN tos_users sw20_user ON sw20_user.id = act20.sw_by

        LEFT JOIN tos_activity_points sw_ap ON sw_ap.id = act10.sw_wb
        LEFT JOIN tos_activity_points fw_ap ON fw_ap.id = act10.fw_wb

        LEFT JOIN tos_customer cust ON ord.customer_id = cust.id
        LEFT JOIN tos_drivers drv ON ord.driver_id = drv.id
        LEFT JOIN tos_suppliers supp ON ord.supplier_id = supp.id
        LEFT JOIN tos_transporter trans ON ord.transporter_id = trans.id
        LEFT JOIN tos_dispatch_type dt ON ord.dispatch_type_id = dt.id
        LEFT JOIN tos_purchase_type pt ON ord.purchase_type_id = pt.id
        LEFT JOIN tos_packing_type packty ON ord.packing_type_id = packty.id

        ${where}

        GROUP BY
          act.id,
          ord.id,
          bc.id,
          drv.id,
          cust.id,
          supp.id,
          trans.id,
          pt.id,
          dt.id,
          packty.id,
          act10.id,
          act20.id,
          sw_ap.id,
          fw_ap.id,
          fw10_user.id,
          sw10_user.id,
          fw20_user.id,
          sw20_user.id

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

  // Temporarily disabled manual CMS backfill.
  // This method sends full WB ticket detail payloads to CMS for existing tickets,
  // walking delivery orders by id and saving progress in tos_sync_meta so it can resume.
  /*
  async backfillWeighbridgeTicketDetails() {
    const SYNC_KEY = "wb_ticket_details_backfill_last_delivery_order_id";

    try {
      let lastOrderId = Number(await this.getLastSync(SYNC_KEY)) || 0;
      const chunkSize = 100;
      let totalRows = 0;
      let totalChunks = 0;

      while (true) {
        const params = [lastOrderId];

        const query = `
          SELECT
            act.id AS activity_id,
            act.activity_type,

            GREATEST(
              act.updated_at,
              COALESCE(MAX(f_ord.updated_at), act.updated_at)
            ) AS updated_at,

            ord.created_at,

            ord.id AS delivery_order_id,
            ord.order_number,
            ord.truck_no,
            ord.trailler_no,
            ord.vessel_id,
            ord.old_truck_no,
            ord.isactive,
            ord.do_no,
            ord.order_type,
            ord.driver_id,
            ord.customer_id,
            ord.supplier_id,
            ord.transporter_id,
            ord.purchase_type_id,
            ord.dispatch_type_id,

            bc.id AS buying_center_id,
            bc.cms_id AS buying_center_cms_id,
            bc.name AS buying_center_name,

            jsonb_build_object(
              'id', drv.id,
              'name', drv.name,
              'license_no', drv.license_no,
              'id_no', drv.id_no
            ) AS driver,

            jsonb_build_object(
              'id', cust.id,
              'name', cust.name,
              'bp_code', cust.bp_code
            ) AS customer,

            jsonb_build_object(
              'id', supp.id,
              'name', supp.name,
              'phone_number', supp.phone_number
            ) AS supplier,

            jsonb_build_object(
              'id', trans.id,
              'title', trans.title
            ) AS transporter,

            jsonb_build_object(
              'id', bc.id,
              'title', bc.name,
              'village', bc.village_name,
              'cotton_type', bc.cotton_type_name
            ) AS buying_center,

            jsonb_build_object(
              'id', pt.id,
              'title', pt.title
            ) AS purchase_type,

            jsonb_build_object(
              'id', dt.id,
              'title', dt.title
            ) AS dispatch_type,

            jsonb_build_object(
              'id', packty.id,
              'name', packty.name
            ) AS packing_type,

            act.gross_weight,
            act.qty AS net_weight,

            COALESCE(
              json_agg(
                jsonb_build_object(
                  'quantity', f_ord.measurement,
                  'price_per_unit', COALESCE(f_ord.price_per_unit::numeric, 0),
                  'total_amount',
                    COALESCE(f_ord.price_per_unit::numeric, 0)
                    * COALESCE(NULLIF(f_ord.measurement, '')::numeric, 0),
                  'name', product.name,
                  'id', product.id,
                  'sku', product.item_code,
                  'unit', f_ord.unit,
                  'transaction_type', f_ord.transaction_type,
                  'source', f_ord.source,
                  'destination', COALESCE(dest.title, f_ord.destination::text),
                  'destination_id', dest.id,
                  'destination_type', dest.type,
                  'destination_details', jsonb_build_object(
                    'id', dest.id,
                    'title', dest.title,
                    'type', dest.type
                  ),
                  'measurement', f_ord.measurement
                )
              ) FILTER (WHERE f_ord.id IS NOT NULL),
              '[]'::json
            ) AS products,

            sw_ap.name AS sw_wb,
            fw_ap.name AS fw_wb,
            act10.delivery_order_id AS order10_id,
            act10.truck_no AS truck_no_10,
            act10.images,
            act10.tare_weight,
            act10.gross_weight AS gross_weight_10,
            act10.qty AS net_weight_10,
            act10.id AS activity10_id,
            act10.created_at AS created10_at,
            act10.sw_at AS sw10_at,
            act10.fw_by AS fw10_by,
            act10.sw_by AS sw10_by,
            act10.avrg_w AS avrg_w,
            act10.reason AS reason,
            act10.sw_truck_no AS sw_truck_no,

            jsonb_build_object(
              'id', fw10_user.id,
              'name', CONCAT(fw10_user.first_name, ' ', fw10_user.last_name),
              'phone', fw10_user.phone
            ) AS fw10_user,

            jsonb_build_object(
              'id', sw10_user.id,
              'name', CONCAT(sw10_user.first_name, ' ', sw10_user.last_name),
              'phone', sw10_user.phone
            ) AS sw10_user,

            act20.delivery_order_id AS order20_id,
            act20.gross_weight AS gross_weight_20,
            act20.qty AS net_weight_20,
            act20.created_at AS created20_at,
            act20.id AS activity20_id,
            act20.sw_at AS sw20_at,
            act20.fw_by AS fw20_by,
            act20.sw_by AS sw20_by,
            act20.avrg_w AS avrg_w_20,

            jsonb_build_object(
              'id', fw20_user.id,
              'name', CONCAT(fw20_user.first_name, ' ', fw20_user.last_name),
              'phone', fw20_user.phone
            ) AS fw20_user,

            jsonb_build_object(
              'id', sw20_user.id,
              'name', CONCAT(sw20_user.first_name, ' ', sw20_user.last_name),
              'phone', sw20_user.phone
            ) AS sw20_user,

            COALESCE(
              SUM(NULLIF(f_ord.measurement, '')::numeric),
              0
            ) AS total_bags,

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

          INNER JOIN tos_buying_center bc
            ON bc.id = ord.buying_center_id

          LEFT JOIN tos_finished_orders f_ord
            ON f_ord.delivery_order_id = ord.id

          INNER JOIN tos_product product
            ON product.id = f_ord.product_id

          LEFT JOIN tos_destinations dest
            ON dest.id::text = f_ord.destination::text

          LEFT JOIN tos_activities act10
            ON ord.id = act10.delivery_order_id AND act10.activity_type = 10

          LEFT JOIN tos_activities act20
            ON ord.id = act20.delivery_order_id AND act20.activity_type = 20

          LEFT JOIN tos_users fw10_user ON fw10_user.id = act10.fw_by
          LEFT JOIN tos_users sw10_user ON sw10_user.id = act10.sw_by
          LEFT JOIN tos_users fw20_user ON fw20_user.id = act20.fw_by
          LEFT JOIN tos_users sw20_user ON sw20_user.id = act20.sw_by

          LEFT JOIN tos_activity_points sw_ap ON sw_ap.id = act10.sw_wb
          LEFT JOIN tos_activity_points fw_ap ON fw_ap.id = act10.fw_wb

          LEFT JOIN tos_customer cust ON ord.customer_id = cust.id
          LEFT JOIN tos_drivers drv ON ord.driver_id = drv.id
          LEFT JOIN tos_suppliers supp ON ord.supplier_id = supp.id
          LEFT JOIN tos_transporter trans ON ord.transporter_id = trans.id
          LEFT JOIN tos_dispatch_type dt ON ord.dispatch_type_id = dt.id
          LEFT JOIN tos_purchase_type pt ON ord.purchase_type_id = pt.id
          LEFT JOIN tos_packing_type packty ON ord.packing_type_id = packty.id

          WHERE
            ord.id > $1
            AND act.activity_type IN (10,20)
            AND act.sw_at IS NOT NULL
            AND act.qty IS NOT NULL
            AND act.gross_weight IS NOT NULL
            AND bc.cms_id IS NOT NULL
            AND (
              product.id = 18
              OR TRIM(LOWER(product.name)) = 'seed cotton'
            )

          GROUP BY
            act.id,
            ord.id,
            bc.id,
            drv.id,
            cust.id,
            supp.id,
            trans.id,
            pt.id,
            dt.id,
            packty.id,
            act10.id,
            act20.id,
            sw_ap.id,
            fw_ap.id,
            fw10_user.id,
            sw10_user.id,
            fw20_user.id,
            sw20_user.id

          ORDER BY ord.id ASC, act.id ASC

          LIMIT 500
        `;

        const res = await db.query(query, params);
        const rows = res.rows;

        if (!rows.length) {
          console.log("WB ticket details backfill complete");
          return {
            success: true,
            message: "WB ticket details backfill complete",
            lastDeliveryOrderId: lastOrderId,
            totalRows,
            totalChunks,
          };
        }

        for (let i = 0; i < rows.length; i += chunkSize) {
          const chunk = rows.slice(i, i + chunkSize);

          const response = await axios.post(
            `${API_URL}/tickets/backfill-details`,
            { data: chunk },
            {
              headers: {
                Authorization: `Bearer ${API_KEY}`,
                Accept: "application/json",
              },
              timeout: 30000,
            },
          );

          totalChunks += 1;
          console.log("Backfill chunk:", response.data);
        }

        totalRows += rows.length;
        lastOrderId = Math.max(
          ...rows.map((row) => Number(row.delivery_order_id)),
        );
        await this.setLastSync(SYNC_KEY, lastOrderId);

        console.log(
          `Backfilled WB ticket details up to delivery_order_id ${lastOrderId}`,
        );
      }
    } catch (error) {
      console.error(error);
      console.error("WB ticket details backfill failed:", error.message);

      return {
        success: false,
        message: "WB ticket details backfill failed",
        error: error.message,
      };
    }
  }
  */
}

module.exports = new SyncService();
