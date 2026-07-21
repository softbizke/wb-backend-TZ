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
    this.rerunRequested = false;
  }

  // =============================
  // SYNC ALL
  // =============================
  async syncAll(source = "Manual") {
    if (this.isRunning) {
      this.rerunRequested = true;
      console.log("Sync already running; queued one follow-up sync...");
      return {
        success: true,
        skipped: false,
        queued: true,
        message: "Sync queued behind the current run",
      };
    }

    this.isRunning = true;
    const startedAt = new Date().toISOString();

    try {
      do {
        this.rerunRequested = false;
        console.log(`${source} sync running...`);
        await this.syncDrivers();
        await this.syncBuyingCenters();
        await this.syncWeighbridge();

        if (this.rerunRequested) {
          source = "Queued";
          console.log("Starting queued follow-up sync...");
        }
      } while (this.rerunRequested);

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
        const villageId = c.cms_village_id ?? c.cms_zone_id;
        const villageName = c.village_name ?? c.zone_name;

        const buyingCenterResult = await db.query(
          `
          INSERT INTO tos_buying_center (
            cms_id, code, name, distance, is_active, updated_at, cms_village_id, village_name, cms_cotton_type_id, cotton_type_name, is_multiple_branches
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
          ON CONFLICT (cms_id)
          DO UPDATE SET
            code = EXCLUDED.code,
            name = EXCLUDED.name,
            distance = EXCLUDED.distance,
            is_active = EXCLUDED.is_active,
            updated_at = EXCLUDED.updated_at,
            cms_village_id = EXCLUDED.cms_village_id,
            village_name = EXCLUDED.village_name,
            cms_cotton_type_id = EXCLUDED.cms_cotton_type_id,
            cotton_type_name = EXCLUDED.cotton_type_name,
            is_multiple_branches = EXCLUDED.is_multiple_branches
          RETURNING id;
        `,
          [
            c.id,
            c.code,
            c.name,
            c.distance,
            c.is_active,
            c.updated_at,
            villageId,
            villageName,
            c.cms_cotton_type_id,
            c.cotton_type_name,
            Boolean(c.is_multi_village ?? c.is_multiple_branches),
          ],
        );

        await this.upsertBuyingCenterBranches(
          buyingCenterResult.rows[0].id,
          c.branches,
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
  // ONE-TIME CMS MASTER DATA UPDATE
  // Updates drivers and buying centers from CMS changes since Jan 1, 2026.
  // This does not delete local-only rows and does not move normal sync cursors.
  // =============================
  async manualSyncCmsMasterDataFrom2026() {
    const since = "2026-01-01T00:00:00.000Z";
    const startedAt = new Date().toISOString();

    try {
      const [drivers, buyingCenters] = await Promise.all([
        this.fetchCmsData("drivers", since),
        this.fetchCmsData("buying-centers", since),
      ]);

      const driverResult = await this.upsertManualDrivers(drivers);
      const buyingCenterResult =
        await this.upsertManualBuyingCenters(buyingCenters);

      return {
        success: true,
        message: "Manual CMS master data sync completed",
        since,
        startedAt,
        finishedAt: new Date().toISOString(),
        drivers: driverResult,
        buying_centers: buyingCenterResult,
      };
    } catch (error) {
      console.error("Manual CMS master data sync failed:", error.message);
      return {
        success: false,
        message: "Manual CMS master data sync failed",
        error: error.message,
        since,
        startedAt,
        finishedAt: new Date().toISOString(),
      };
    }
  }

  async fetchCmsData(resource, since) {
    const response = await axios.get(
      `${API_URL}/${resource}?since=${encodeURIComponent(since)}`,
      {
        headers: {
          Authorization: "Bearer " + API_KEY,
          Accept: "application/json",
        },
      },
    );

    return response.data.data || [];
  }

  async upsertManualDrivers(drivers) {
    const columns = await this.getTableColumns("tos_drivers");
    const result = {
      received: drivers.length,
      inserted: 0,
      updated: 0,
      skipped: 0,
    };

    for (const driver of drivers) {
      if (!driver.id) {
        result.skipped += 1;
        continue;
      }

      const row = {
        cms_id: driver.id,
        code: driver.code,
        name: driver.name,
        license_no: driver.license_no,
        phone: driver.phone,
        id_no: driver.id_no,
        email: driver.email,
        address: driver.address,
        is_active: driver.is_active,
        updated_at: driver.updated_at,
      };

      const existingId = await this.findExistingManualRow(
        "tos_drivers",
        columns,
        [
          { column: "cms_id", value: driver.id },
          { column: "code", value: driver.code },
          { column: "id_no", value: driver.id_no },
        ],
      );

      if (existingId) {
        await this.updateManualRow("tos_drivers", columns, existingId, row);
        result.updated += 1;
      } else {
        await this.insertManualRow("tos_drivers", columns, row);
        result.inserted += 1;
      }
    }

    console.log(
      `Manual driver sync complete. Received ${result.received}, updated ${result.updated}, inserted ${result.inserted}`,
    );

    return result;
  }

  async upsertManualBuyingCenters(centers) {
    const columns = await this.getTableColumns("tos_buying_center");
    const result = {
      received: centers.length,
      inserted: 0,
      updated: 0,
      skipped: 0,
    };

    for (const center of centers) {
      if (!center.id) {
        result.skipped += 1;
        continue;
      }

      const villageId = center.cms_village_id ?? center.cms_zone_id;
      const villageName = center.village_name ?? center.zone_name;

      const row = {
        cms_id: center.id,
        code: center.code,
        name: center.name,
        distance: center.distance,
        is_active: center.is_active,
        isactive: center.is_active,
        updated_at: center.updated_at,
        cms_village_id: villageId,
        village_name: villageName,
        cms_zone_id: villageId,
        zone_name: villageName,
        cms_cotton_type_id: center.cms_cotton_type_id,
        cotton_type_name: center.cotton_type_name,
        is_multiple_branches: Boolean(
          center.is_multi_village ?? center.is_multiple_branches,
        ),
      };

      const existingId = await this.findExistingManualRow(
        "tos_buying_center",
        columns,
        [
          { column: "cms_id", value: center.id },
          { column: "code", value: center.code },
          { column: "name", value: center.name },
        ],
      );

      if (existingId) {
        await this.updateManualRow(
          "tos_buying_center",
          columns,
          existingId,
          row,
        );
        await this.upsertBuyingCenterBranches(existingId, center.branches);
        result.updated += 1;
      } else {
        await this.insertManualRow("tos_buying_center", columns, row);
        const insertedId = await this.findExistingManualRow(
          "tos_buying_center",
          columns,
          [{ column: "cms_id", value: center.id }],
        );
        await this.upsertBuyingCenterBranches(insertedId, center.branches);
        result.inserted += 1;
      }
    }

    console.log(
      `Manual buying center sync complete. Received ${result.received}, updated ${result.updated}, inserted ${result.inserted}`,
    );

    return result;
  }

  async upsertBuyingCenterBranches(buyingCenterId, branches = []) {
    if (!buyingCenterId || !Array.isArray(branches)) return;

    const cmsIds = [];

    for (const branch of branches) {
      if (!branch?.id) continue;

      cmsIds.push(branch.id);

      await db.query(
        `
          INSERT INTO tos_buying_center_branches (
            buying_center_id, cms_id, code, name, population, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
          ON CONFLICT (cms_id)
          DO UPDATE SET
            buying_center_id = EXCLUDED.buying_center_id,
            code = EXCLUDED.code,
            name = EXCLUDED.name,
            population = EXCLUDED.population,
            updated_at = CURRENT_TIMESTAMP
        `,
        [
          buyingCenterId,
          branch.id,
          branch.code,
          branch.name,
          branch.population,
        ],
      );
    }

    if (cmsIds.length > 0) {
      await db.query(
        `
          DELETE FROM tos_buying_center_branches
          WHERE buying_center_id = $1
            AND cms_id <> ALL($2::bigint[])
        `,
        [buyingCenterId, cmsIds],
      );
    }
  }

  async findExistingManualRow(tableName, columns, matchers) {
    for (const matcher of matchers) {
      if (!columns.has(matcher.column)) continue;
      if (
        matcher.value === undefined ||
        matcher.value === null ||
        matcher.value === ""
      ) {
        continue;
      }

      const result = await db.query(
        `
        SELECT id
        FROM ${tableName}
        WHERE ${matcher.column} = $1
        ORDER BY id ASC
        LIMIT 1
      `,
        [matcher.value],
      );

      if (result.rows.length > 0) {
        return result.rows[0].id;
      }
    }

    return null;
  }

  async updateManualRow(tableName, columns, id, row) {
    const updateFields = [];
    const values = [];

    for (const [column, value] of Object.entries(row)) {
      if (!columns.has(column)) continue;

      values.push(value);
      updateFields.push(`${column} = $${values.length}`);
    }

    if (!updateFields.length) return;

    values.push(id);

    await db.query(
      `
      UPDATE ${tableName}
      SET ${updateFields.join(", ")}
      WHERE id = $${values.length}
    `,
      values,
    );
  }

  async insertManualRow(tableName, columns, row) {
    const insertColumns = [];
    const values = [];

    for (const [column, value] of Object.entries(row)) {
      if (!columns.has(column)) continue;

      insertColumns.push(column);
      values.push(value);
    }

    if (!insertColumns.length) return;

    const placeholders = insertColumns.map((_, index) => `$${index + 1}`);

    await db.query(
      `
      INSERT INTO ${tableName} (${insertColumns.join(", ")})
      VALUES (${placeholders.join(", ")})
    `,
      values,
    );
  }

  async getTableColumns(tableName) {
    const result = await db.query(
      `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
    `,
      [tableName],
    );

    return new Set(result.rows.map((row) => row.column_name));
  }

  // =============================
  // SYNC WEIGHBRIDGE (WB → CMS)
  // =============================

  async syncWeighbridge() {
    const SYNC_KEY = "wb_last_sync";

    try {
      const lastSync = await this.getLastSync(SYNC_KEY);

      // safety buffer to avoid missing same-second records
      const safeSince = lastSync
        ? new Date(new Date(lastSync).getTime() - 2000).toISOString()
        : null;

      const params = [];

      let where = `
      WHERE
        act.activity_type IN (10,20)
        AND act.sw_at IS NOT NULL
        -- AND act.sw_at < NOW() - INTERVAL '30 seconds'
        AND act.qty IS NOT NULL
        AND act.gross_weight IS NOT NULL
        AND bc.cms_id IS NOT NULL
        AND (
          product.id = 18
          OR TRIM(LOWER(product.name)) = 'seed cotton'
        )
    `;

      if (safeSince) {
        params.push(safeSince);

        where += `
        AND act.sw_at > $${params.length}
      `;
      }

      const query = `
      SELECT
        act.id AS activity_id,
        act.activity_type,

        -- canonical sync cursor: final second-weight time for the synced activity row
        act.sw_at AS updated_at,

        -- canonical first/second weight operator details for the synced activity row
        act.fw_at,
        act.fw_by,
        act.sw_at,
        act.sw_by,

        jsonb_build_object(
          'id', fw_user.id,
          'name', CONCAT(fw_user.first_name, ' ', fw_user.last_name),
          'phone', fw_user.phone
        ) AS fw_operator,

        jsonb_build_object(
          'id', sw_user.id,
          'name', CONCAT(sw_user.first_name, ' ', sw_user.last_name),
          'phone', sw_user.phone
        ) AS sw_operator,

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
        ord.branch_id,

        bc.id AS buying_center_id,
        bc.cms_id AS buying_center_cms_id,
        bc.name AS buying_center_name,
        b.name AS branch_name,
        b.code AS branch_code,
        b.cms_id AS cms_branch_id,

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
          'cotton_type', bc.cotton_type_name,
          'is_multiple_branches', bc.is_multiple_branches,
          'branch_id', ord.branch_id,
          'branch', jsonb_build_object(
            'id', b.cms_id,
            'code', b.code,
            'name', b.name,
            'population', b.population
          )
        ) AS buying_center,

        jsonb_build_object(
          'id', b.cms_id,
          'code', b.code,
          'name', b.name,
          'population', b.population
        ) AS branch,

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
        act10.fw_at AS fw10_at,
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
        act20.fw_at AS fw20_at,
        act20.sw_at AS sw20_at,
        act20.id AS activity20_id,
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
            NULLIF(f_ord.measurement, '')::numeric
            * COALESCE(f_ord.price_per_unit, 0)
          ),
          0
        ) AS total_amount

      FROM tos_activities act

      INNER JOIN tos_delivery_orders ord
        ON ord.id = act.delivery_order_id

      INNER JOIN tos_buying_center bc
        ON bc.id = ord.buying_center_id

      LEFT JOIN tos_buying_center_branches b
        ON b.cms_id = ord.branch_id

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

      LEFT JOIN tos_users fw_user ON fw_user.id = act.fw_by
      LEFT JOIN tos_users sw_user ON sw_user.id = act.sw_by

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
        b.id,
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
        fw_user.id,
        sw_user.id,
        fw10_user.id,
        sw10_user.id,
        fw20_user.id,
        sw20_user.id

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

  // async syncWeighbridge() {
  //   const SYNC_KEY = "wb_last_sync";

  //   try {
  //     const lastSync = await this.getLastSync(SYNC_KEY);

  //     // safety buffer to avoid missing same-second updates
  //     const safeSince = lastSync
  //       ? new Date(new Date(lastSync).getTime() - 2000).toISOString()
  //       : null;

  //     const params = [];

  //     // =========================================
  //     // ONLY COMPLETED / PROCESSED ORDERS
  //     // =========================================

  //     //Note: We will only push tickets to CMS only if product is seed cotton or product id is 18
  //     let where = `
  //       WHERE
  //         act.activity_type IN (10,20)
  //         AND act.sw_at IS NOT NULL
  //         AND act.qty IS NOT NULL
  //         AND act.gross_weight IS NOT NULL
  //         AND bc.cms_id IS NOT NULL
  //         AND (
  //           product.id = 18
  //           OR TRIM(LOWER(product.name)) = 'seed cotton'
  //         )
  //     `;

  //     let having = "";

  //     // =========================================
  //     // SYNC ONLY NEW/UPDATED RECORDS
  //     // =========================================
  //     if (safeSince) {
  //       params.push(safeSince);

  //       having = `
  //         HAVING GREATEST(
  //           act.updated_at,
  //           COALESCE(MAX(f_ord.updated_at), act.updated_at)
  //         ) > $${params.length}
  //       `;
  //     }

  //     const query = `
  //       SELECT
  //         act.id AS activity_id,
  //         act.activity_type,

  //         -- unified updated_at
  //         GREATEST(
  //           act.updated_at,
  //           COALESCE(MAX(f_ord.updated_at), act.updated_at)
  //         ) AS updated_at,

  //         ord.created_at,

  //         ord.id AS delivery_order_id,
  //         ord.order_number,
  //         ord.truck_no,
  //         ord.trailler_no,
  //         ord.vessel_id,
  //         ord.old_truck_no,
  //         ord.isactive,
  //         ord.do_no,
  //         ord.order_type,
  //         ord.driver_id,
  //         ord.customer_id,
  //         ord.supplier_id,
  //         ord.transporter_id,
  //         ord.purchase_type_id,
  //         ord.dispatch_type_id,

  //         bc.id AS buying_center_id,
  //         bc.cms_id AS buying_center_cms_id,
  //         bc.name AS buying_center_name,

  //         jsonb_build_object(
  //           'id', drv.id,
  //           'name', drv.name,
  //           'license_no', drv.license_no,
  //           'id_no', drv.id_no
  //         ) AS driver,

  //         jsonb_build_object(
  //           'id', cust.id,
  //           'name', cust.name,
  //           'bp_code', cust.bp_code
  //         ) AS customer,

  //         jsonb_build_object(
  //           'id', supp.id,
  //           'name', supp.name,
  //           'phone_number', supp.phone_number
  //         ) AS supplier,

  //         jsonb_build_object(
  //           'id', trans.id,
  //           'title', trans.title
  //         ) AS transporter,

  //         jsonb_build_object(
  //           'id', bc.id,
  //           'title', bc.name,
  //           'village', bc.village_name,
  //           'cotton_type', bc.cotton_type_name
  //         ) AS buying_center,

  //         jsonb_build_object(
  //           'id', pt.id,
  //           'title', pt.title
  //         ) AS purchase_type,

  //         jsonb_build_object(
  //           'id', dt.id,
  //           'title', dt.title
  //         ) AS dispatch_type,

  //         jsonb_build_object(
  //           'id', packty.id,
  //           'name', packty.name
  //         ) AS packing_type,

  //         act.gross_weight,
  //         act.qty AS net_weight,

  //         COALESCE(
  //           json_agg(
  //             jsonb_build_object(
  //               'quantity', f_ord.measurement,
  //               'price_per_unit', COALESCE(f_ord.price_per_unit::numeric, 0),
  //               'total_amount',
  //                 COALESCE(f_ord.price_per_unit::numeric, 0)
  //                 * COALESCE(NULLIF(f_ord.measurement, '')::numeric, 0),
  //               'name', product.name,
  //               'id', product.id,
  //               'sku', product.item_code,
  //               'unit', f_ord.unit,
  //               'transaction_type', f_ord.transaction_type,
  //               'source', f_ord.source,
  //               'destination', COALESCE(dest.title, f_ord.destination::text),
  //               'destination_id', dest.id,
  //               'destination_type', dest.type,
  //               'destination_details', jsonb_build_object(
  //                 'id', dest.id,
  //                 'title', dest.title,
  //                 'type', dest.type
  //               ),
  //               'measurement', f_ord.measurement
  //             )
  //           ) FILTER (WHERE f_ord.id IS NOT NULL),
  //           '[]'::json
  //         ) AS products,

  //         sw_ap.name AS sw_wb,
  //         fw_ap.name AS fw_wb,
  //         act10.delivery_order_id AS order10_id,
  //         act10.truck_no AS truck_no_10,
  //         act10.images,
  //         act10.tare_weight,
  //         act10.gross_weight AS gross_weight_10,
  //         act10.qty AS net_weight_10,
  //         act10.id AS activity10_id,
  //         act10.created_at AS created10_at,
  //         act10.sw_at AS sw10_at,
  //         act10.fw_by AS fw10_by,
  //         act10.sw_by AS sw10_by,
  //         act10.avrg_w AS avrg_w,
  //         act10.reason AS reason,
  //         act10.sw_truck_no AS sw_truck_no,

  //         jsonb_build_object(
  //           'id', fw10_user.id,
  //           'name', CONCAT(fw10_user.first_name, ' ', fw10_user.last_name),
  //           'phone', fw10_user.phone
  //         ) AS fw10_user,

  //         jsonb_build_object(
  //           'id', sw10_user.id,
  //           'name', CONCAT(sw10_user.first_name, ' ', sw10_user.last_name),
  //           'phone', sw10_user.phone
  //         ) AS sw10_user,

  //         act20.delivery_order_id AS order20_id,
  //         act20.gross_weight AS gross_weight_20,
  //         act20.qty AS net_weight_20,
  //         act20.created_at AS created20_at,
  //         act20.id AS activity20_id,
  //         act20.sw_at AS sw20_at,
  //         act20.fw_by AS fw20_by,
  //         act20.sw_by AS sw20_by,
  //         act20.avrg_w AS avrg_w_20,

  //         jsonb_build_object(
  //           'id', fw20_user.id,
  //           'name', CONCAT(fw20_user.first_name, ' ', fw20_user.last_name),
  //           'phone', fw20_user.phone
  //         ) AS fw20_user,

  //         jsonb_build_object(
  //           'id', sw20_user.id,
  //           'name', CONCAT(sw20_user.first_name, ' ', sw20_user.last_name),
  //           'phone', sw20_user.phone
  //         ) AS sw20_user,

  //         -- bags total
  //         COALESCE(
  //           SUM(NULLIF(f_ord.measurement, '')::numeric),
  //           0
  //         ) AS total_bags,

  //         -- amount total
  //         COALESCE(
  //           SUM(
  //             (NULLIF(f_ord.measurement, '')::numeric)
  //             * COALESCE(f_ord.price_per_unit, 0)
  //           ),
  //           0
  //         ) AS total_amount

  //       FROM tos_activities act

  //       INNER JOIN tos_delivery_orders ord
  //         ON ord.id = act.delivery_order_id

  //       INNER JOIN tos_buying_center bc
  //         ON bc.id = ord.buying_center_id

  //       LEFT JOIN tos_finished_orders f_ord
  //         ON f_ord.delivery_order_id = ord.id

  //       INNER JOIN tos_product product
  //         ON product.id = f_ord.product_id

  //       LEFT JOIN tos_destinations dest
  //         ON dest.id::text = f_ord.destination::text

  //       LEFT JOIN tos_activities act10
  //         ON ord.id = act10.delivery_order_id AND act10.activity_type = 10

  //       LEFT JOIN tos_activities act20
  //         ON ord.id = act20.delivery_order_id AND act20.activity_type = 20

  //       LEFT JOIN tos_users fw10_user ON fw10_user.id = act10.fw_by
  //       LEFT JOIN tos_users sw10_user ON sw10_user.id = act10.sw_by
  //       LEFT JOIN tos_users fw20_user ON fw20_user.id = act20.fw_by
  //       LEFT JOIN tos_users sw20_user ON sw20_user.id = act20.sw_by

  //       LEFT JOIN tos_activity_points sw_ap ON sw_ap.id = act10.sw_wb
  //       LEFT JOIN tos_activity_points fw_ap ON fw_ap.id = act10.fw_wb

  //       LEFT JOIN tos_customer cust ON ord.customer_id = cust.id
  //       LEFT JOIN tos_drivers drv ON ord.driver_id = drv.id
  //       LEFT JOIN tos_suppliers supp ON ord.supplier_id = supp.id
  //       LEFT JOIN tos_transporter trans ON ord.transporter_id = trans.id
  //       LEFT JOIN tos_dispatch_type dt ON ord.dispatch_type_id = dt.id
  //       LEFT JOIN tos_purchase_type pt ON ord.purchase_type_id = pt.id
  //       LEFT JOIN tos_packing_type packty ON ord.packing_type_id = packty.id

  //       ${where}

  //       GROUP BY
  //         act.id,
  //         ord.id,
  //         bc.id,
  //         drv.id,
  //         cust.id,
  //         supp.id,
  //         trans.id,
  //         pt.id,
  //         dt.id,
  //         packty.id,
  //         act10.id,
  //         act20.id,
  //         sw_ap.id,
  //         fw_ap.id,
  //         fw10_user.id,
  //         sw10_user.id,
  //         fw20_user.id,
  //         sw20_user.id

  //       ${having}

  //       ORDER BY
  //         updated_at ASC

  //       LIMIT 500
  //     `;

  //     const res = await db.query(query, params);
  //     const rows = res.rows;

  //     console.log(`SYNC WB Tickets rows`, rows);
  //     console.log(
  //       `Fetched ${rows.length} updated WB records since ${safeSince}`,
  //     );

  //     if (!rows.length) {
  //       console.log("No WB data to sync");
  //       return;
  //     }

  //     // =========================================
  //     // SEND IN CHUNKS
  //     // =========================================
  //     const chunkSize = 100;

  //     for (let i = 0; i < rows.length; i += chunkSize) {
  //       const chunk = rows.slice(i, i + chunkSize);

  //       await axios.post(
  //         `${API_URL}/tickets`,
  //         { data: chunk },
  //         {
  //           headers: {
  //             Authorization: `Bearer ${API_KEY}`,
  //             Accept: "application/json",
  //           },
  //           timeout: 20000,
  //         },
  //       );
  //     }

  //     // =========================================
  //     // UPDATE LAST SYNC ONLY AFTER SUCCESS
  //     // =========================================
  //     const latestTimestamp = rows[rows.length - 1]?.updated_at;

  //     if (latestTimestamp) {
  //       await this.setLastSync(SYNC_KEY, latestTimestamp);
  //     }

  //     console.log(`Synced ${rows.length} WB records`);
  //   } catch (error) {
  //     console.error(error);
  //     console.error("WB sync failed:", error.message);
  //   }
  // }

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

  // =============================
  // BACKFILL BUYING CENTERS
  // =============================
  async backfillBuyingCenters() {
    const since = "2026-01-01T00:00:00.000Z";
    const startedAt = new Date().toISOString();

    try {
      console.log("Starting buying center backfill...");

      // Step 1: Fetch CMS buying centers
      const cmsBCs = await this.fetchCmsData("buying-centers", since);
      console.log(`Fetched ${cmsBCs.length} CMS buying centers`);

      // Step 2: Get all WB buying centers
      const wbBCsResult = await db.query(
        `SELECT id, cms_id, name FROM tos_buying_center ORDER BY id ASC`,
      );
      const wbBCs = wbBCsResult.rows;
      console.log(`Fetched ${wbBCs.length} WB buying centers`);

      // Step 3: Create a map of CMS BCs by lowercase name
      const cmsBCMap = new Map();
      for (const cmsBC of cmsBCs) {
        const lowerName = (cmsBC.name || "").trim().toLowerCase();
        cmsBCMap.set(lowerName, cmsBC);
      }

      // Step 4: Categorize WB BCs
      const correct = [];
      const mismatched = [];
      const orphan = [];

      for (const wbBC of wbBCs) {
        const wbLowerName = (wbBC.name || "").trim().toLowerCase();
        const cmsMatched = cmsBCMap.get(wbLowerName);

        if (cmsMatched) {
          // Found a match in CMS by name
          if (wbBC.cms_id === cmsMatched.id) {
            // CMS IDs match perfectly
            correct.push(wbBC);
          } else {
            // Mismatch: name matches but cms_id is wrong
            mismatched.push({
              wbBC,
              cms_matched: cmsMatched,
            });
          }
        } else {
          // No match found in CMS
          orphan.push(wbBC);
        }
      }

      console.log(
        `Categorized: ${correct.length} correct, ${mismatched.length} mismatched, ${orphan.length} orphan`,
      );

      const report = {
        started_at: startedAt,
        cms_bcs_fetched: cmsBCs.length,
        wb_bcs_total: wbBCs.length,
        categorized: {
          correct: correct.length,
          mismatched: mismatched.length,
          orphan: orphan.length,
        },
        actions: {
          orders_updated: 0,
          bcs_deleted: 0,
          bcs_deactivated: 0,
        },
        details: {
          deleted_bc_ids: [],
          deactivated_bc_ids: [],
          updated_order_ids: [],
        },
      };

      // =============================
      // Step 5: Handle mismatched BCs
      // =============================
      for (const mismatch of mismatched) {
        const { wbBC, cms_matched } = mismatch;

        // Find the correct WB BC (the one with cms_id = cms_matched.id)
        const correctBC = wbBCs.find((bc) => bc.cms_id === cms_matched.id);

        if (correctBC) {
          console.log(
            `Mismatched BC id=${wbBC.id} (name="${wbBC.name}") → updating orders to correct BC id=${correctBC.id}`,
          );

          // Find orders linked to this mismatched BC
          const ordersResult = await db.query(
            `SELECT id FROM tos_delivery_orders WHERE buying_center_id = $1`,
            [wbBC.id],
          );
          const orderIds = ordersResult.rows.map((r) => r.id);

          // Update orders to point to correct BC
          if (orderIds.length > 0) {
            await db.query(
              `UPDATE tos_delivery_orders SET buying_center_id = $1 WHERE buying_center_id = $2`,
              [correctBC.id, wbBC.id],
            );
            report.actions.orders_updated += orderIds.length;
            report.details.updated_order_ids.push(...orderIds);
            console.log(
              `Updated ${orderIds.length} orders for BC id=${wbBC.id}`,
            );
          }

          // Delete the mismatched BC
          await db.query(`DELETE FROM tos_buying_center WHERE id = $1`, [
            wbBC.id,
          ]);
          report.actions.bcs_deleted += 1;
          report.details.deleted_bc_ids.push(wbBC.id);
          console.log(`Deleted mismatched BC id=${wbBC.id}`);
        }
      }

      // =============================
      // Step 6: Handle orphan BCs
      // =============================
      for (const orphanBC of orphan) {
        // Check if linked to any orders
        const ordersResult = await db.query(
          `SELECT id FROM tos_delivery_orders WHERE buying_center_id = $1`,
          [orphanBC.id],
        );
        const isLinked = ordersResult.rows.length > 0;

        if (isLinked) {
          // Deactivate instead of deleting
          await db.query(
            `UPDATE tos_buying_center SET is_active = false WHERE id = $1`,
            [orphanBC.id],
          );
          report.actions.bcs_deactivated += 1;
          report.details.deactivated_bc_ids.push(orphanBC.id);
          console.log(
            `Deactivated orphan BC id=${orphanBC.id} (linked to ${ordersResult.rows.length} orders)`,
          );
        } else {
          // No orders linked, safe to delete
          await db.query(`DELETE FROM tos_buying_center WHERE id = $1`, [
            orphanBC.id,
          ]);
          report.actions.bcs_deleted += 1;
          report.details.deleted_bc_ids.push(orphanBC.id);
          console.log(`Deleted orphan BC id=${orphanBC.id} (no linked orders)`);
        }
      }

      report.finished_at = new Date().toISOString();

      return {
        success: true,
        message: "Buying center backfill completed",
        ...report,
      };
    } catch (error) {
      console.error("Buying center backfill failed:", error.message);
      console.error(error);
      return {
        success: false,
        message: "Buying center backfill failed",
        error: error.message,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
      };
    }
  }
}

module.exports = new SyncService();
