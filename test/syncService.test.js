const test = require("node:test");
const assert = require("node:assert/strict");

const {
  SyncService,
  validateTicketOperationalProducts,
} = require("../src/services/syncService");

test("operational products are matched by authoritative cms_id", async () => {
  const queries = [];
  const httpCalls = [];
  const db = {
    async query(sql, params) {
      queries.push({ sql, params });
      return { rows: [{ id: 18 }] };
    },
  };
  const http = {
    async get(url, options) {
      httpCalls.push({ url, options });
      return {
        data: {
          data: [
            {
              id: 18,
              cms_id: 3,
              name: "Seed Cotton",
              isactive: true,
              updated_at: "2026-07-31T10:25:30.000000Z",
            },
          ],
        },
      };
    },
  };
  const service = new SyncService({ db, http });
  service.getLastSync = async () => "2026-07-30T00:00:00.000Z";
  let savedSync;
  service.setLastSync = async (key, value) => {
    savedSync = { key, value };
  };

  const result = await service.syncOperationalProducts();

  assert.equal(result.updated, 1);
  assert.equal(result.inserted, 0);
  assert.deepEqual(queries[0].params, ["Seed Cotton", true, 3]);
  assert.match(queries[0].sql, /WHERE cms_id = \$3/);
  assert.match(httpCalls[0].url, /operational-products\?since=/);
  assert.equal(httpCalls[0].options.headers.Accept, "application/json");
  assert.match(httpCalls[0].options.headers.Authorization, /^Bearer /);
  assert.deepEqual(savedSync, {
    key: "operational_products_last_sync",
    value: "2026-07-31T10:25:30.000000Z",
  });
});

test("legacy CMS product id attaches cms_id to an unlinked local product", async () => {
  const queries = [];
  const service = new SyncService({
    db: {
      query: async (sql, params) => {
        queries.push({ sql, params });
        return queries.length === 1 ? { rows: [] } : { rows: [{ id: 18 }] };
      },
    },
    http: {
      get: async () => ({
        data: {
          data: [
            {
              id: 18,
              cms_id: 7,
              name: "Unknown",
              isactive: true,
              updated_at: "2026-07-31T10:25:30.000000Z",
            },
          ],
        },
      }),
    },
  });
  service.getLastSync = async () => null;
  let cursorValue;
  service.setLastSync = async () => {
    cursorValue = "advanced";
  };

  const result = await service.syncOperationalProducts();

  assert.equal(result.inserted, 0);
  assert.equal(result.updated, 1);
  assert.equal(result.unmatched.length, 0);
  assert.deepEqual(queries[1].params, [7, "Unknown", true, 18]);
  assert.match(queries[1].sql, /AND cms_id IS NULL/);
  assert.equal(cursorValue, "advanced");
});

test("new CMS products omit local id and let PostgreSQL generate it", async () => {
  const queries = [];
  const service = new SyncService({
    db: {
      query: async (sql, params) => {
        queries.push({ sql, params });
        return queries.length === 1 ? { rows: [] } : { rows: [] };
      },
    },
    http: {
      get: async () => ({
        data: {
          data: [
            {
              id: null,
              cms_id: 44,
              name: "New Product",
              isactive: true,
              updated_at: "2026-07-31T10:25:30.000000Z",
            },
          ],
        },
      }),
    },
  });
  service.getLastSync = async () => null;
  service.setLastSync = async () => {};

  const result = await service.syncOperationalProducts();

  assert.equal(result.inserted, 1);
  assert.deepEqual(queries[1].params, [44, "New Product", true]);
  assert.match(queries[1].sql, /INSERT INTO tos_product \(cms_id, name, isactive\)/);
  assert.doesNotMatch(queries[1].sql, /INSERT INTO tos_product \(id,/);
});

test("CMS products without cms_id are rejected without advancing cursor", async () => {
  const service = new SyncService({
    db: { query: async () => assert.fail("invalid product must not be written") },
    http: {
      get: async () => ({
        data: {
          data: [{ id: 999, cms_id: null, name: "Invalid", isactive: true }],
        },
      }),
    },
  });
  service.getLastSync = async () => null;
  let cursorAdvanced = false;
  service.setLastSync = async () => {
    cursorAdvanced = true;
  };

  const result = await service.syncOperationalProducts();

  assert.equal(result.unmatched[0].reason, "missing cms_id");
  assert.equal(cursorAdvanced, false);
});

test("ticket payload contains separate local id and CMS operational-product id", async () => {
  const posted = [];
  let ticketQuery;
  const ticket = {
    activity_id: 101,
    updated_at: "2026-07-31T10:25:30.000000Z",
    products: [
      {
        id: 18,
        cms_id: 3,
        name: "Seed Cotton",
        quantity: 8000,
        measurement: 8000,
        price_per_unit: 0,
        total_amount: 0,
      },
    ],
  };
  const service = new SyncService({
    db: {
      query: async (sql) => {
        ticketQuery = sql;
        return { rows: [ticket] };
      },
    },
    http: {
      post: async (url, payload, options) => {
        posted.push({ url, payload, options });
      },
    },
  });
  service.getLastSync = async () => null;
  service.setLastSync = async () => {};

  await service.syncWeighbridge();

  assert.equal(posted[0].payload.data[0].products[0].id, 18);
  assert.equal(posted[0].payload.data[0].products[0].cms_id, 3);
  assert.match(ticketQuery, /'id', product\.id/);
  assert.match(ticketQuery, /'cms_id', product\.cms_id/);
  assert.match(posted[0].options.headers.Authorization, /^Bearer /);
  assert.equal(posted[0].options.headers.Accept, "application/json");
});

test("ticket synchronization is blocked when cms_id is null", () => {
  assert.throws(
    () =>
      validateTicketOperationalProducts([
        { activity_id: 102, products: [{ id: 18, cms_id: null }] },
      ]),
    /Ticket 102 product 18 is missing cms_id/,
  );
});

test("mixed operational-product ids within one ticket are rejected", () => {
  assert.throws(
    () =>
      validateTicketOperationalProducts([
        {
          activity_id: 103,
          products: [
            { id: 18, cms_id: 3 },
            { id: 19, cms_id: 4 },
          ],
        },
      ]),
    /Ticket 103 contains mixed operational-product cms_id values: 3, 4/,
  );
});
