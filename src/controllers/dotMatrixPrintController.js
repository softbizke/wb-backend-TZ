/**
 * Dot Matrix Printer - Product Delivery Order
 * Alliance Ginneries Limited
 *
 * Uses node-escpos or raw serial/parallel port output compatible with
 * Epson ESC/P (9-pin or 24-pin) dot matrix printers.
 *
 * Paper width assumed: 80-column (standard A4 continuous feed)
 * Characters per line at 10 CPI (default): 80 chars
 */

const WIDTH = 80; // characters per line at 10CPI

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Pad / truncate a string to exactly `len` chars */
const pad = (str, len, align = "L", fill = " ") => {
  str = String(str ?? "");
  if (str.length > len) return str.slice(0, len);
  const padding = fill.repeat(len - str.length);
  return align === "R" ? padding + str : str + padding;
};

/** Center a string within `width` characters */
const center = (str, width = WIDTH, fill = " ") => {
  str = String(str ?? "");
  if (str.length >= width) return str.slice(0, width);
  const total = width - str.length;
  const left = Math.floor(total / 2);
  const right = total - left;
  return fill.repeat(left) + str + fill.repeat(right);
};

/** Left + Right aligned on the same line, total width `width` */
const leftRight = (left, right, width = WIDTH) => {
  left = String(left ?? "");
  right = String(right ?? "");
  const gap = width - left.length - right.length;
  if (gap < 1) return (left + " " + right).slice(0, width);
  return left + " ".repeat(gap) + right;
};

/** Three-column row: left | center | right */
const threeCol = (l, c, r, width = WIDTH) => {
  l = String(l ?? "");
  c = String(c ?? "");
  r = String(r ?? "");
  const sideW = Math.floor((width - c.length) / 2);
  const padR = width - sideW - c.length;
  return pad(l, sideW) + c + pad(r, padR, "R");
};

/** Horizontal rule */
const rule = (char = "─", width = WIDTH) => char.repeat(width);
const dblRule = (width = WIDTH) => "═".repeat(width);
const dottedRule = (width = WIDTH) => "·".repeat(width);

/** Format weight with commas and 2 decimals */
const fmt = (v) =>
  v != null
    ? Number(v).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "N/A";

/** Format date  dd-MM-yyyy HH:mm */
const fmtDate = (d) => {
  if (!d) return "N/A";
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  const HH = String(dt.getHours()).padStart(2, "0");
  const MM = String(dt.getMinutes()).padStart(2, "0");
  return `${dd}-${mm}-${yyyy} ${HH}:${MM}`;
};

/** Format a person's name: Title Case */
const fmtName = (n) =>
  n
    ? n
        .toLowerCase()
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "";

// ─── ESC/P Command Bytes ─────────────────────────────────────────────────────
// We build a Buffer / string that can be sent directly to the printer port.

const ESC = "\x1B";
const SI = "\x0F"; // condensed on  (17 CPI → 132 cols on 80-col paper)
const DC2 = "\x12"; // condensed off (back to 10 CPI)
const BOLD_ON = `${ESC}E`;
const BOLD_OFF = `${ESC}F`;
const UNDERLINE_ON = `${ESC}-\x01`;
const UNDERLINE_OFF = `${ESC}-\x00`;
const DOUBLE_WIDTH_ON = `${ESC}W\x01`;
const DOUBLE_WIDTH_OFF = `${ESC}W\x00`;
const DOUBLE_HEIGHT_ON = `${ESC}!\x10`; // select 24-pin double height via bit mask
const RESET = `${ESC}@`;
const LF = "\n";
const CR = "\r";
const FF = "\x0C"; // form feed / cut page
const CRLF = CR + LF;

// ─── Line builder ────────────────────────────────────────────────────────────

class Lines {
  constructor() {
    this._buf = "";
  }

  raw(str) {
    this._buf += str;
    return this;
  }

  line(str = "") {
    this._buf += str + CRLF;
    return this;
  }

  blank(n = 1) {
    for (let i = 0; i < n; i++) this.line();
    return this;
  }

  bold(str) {
    this._buf += BOLD_ON + str + BOLD_OFF;
    return this;
  }

  ul(str) {
    this._buf += UNDERLINE_ON + str + UNDERLINE_OFF;
    return this;
  }

  /** Full line, centered, optionally bold */
  header(str, { bold = false, dw = false } = {}) {
    let out = center(str);
    if (dw) out = DOUBLE_WIDTH_ON + out + DOUBLE_WIDTH_OFF;
    if (bold) out = BOLD_ON + out + BOLD_OFF;
    return this.line(out);
  }

  sectionHeading(label) {
    const inner = `  ${label.toUpperCase()}  `;
    const bar = "▌" + inner + "▐";
    const line = center(bar);
    this._buf += BOLD_ON + line + BOLD_OFF + CRLF;
    return this;
  }

  /** Key-value row: label dots value */
  kv(label, value, labelWidth = 22, totalWidth = WIDTH) {
    label = String(label ?? "");
    value = String(value ?? "N/A");
    const dots = ".".repeat(
      Math.max(1, totalWidth - labelWidth - value.length - 1),
    );
    const l = pad(label, labelWidth);
    this._buf += `${l} ${dots} ${value}` + CRLF;
    return this;
  }

  /** Two kv pairs side-by-side (half-width each) */
  kvDouble(l1, v1, l2, v2) {
    const half = Math.floor(WIDTH / 2);
    const lw = 12;
    const dots1 = ".".repeat(
      Math.max(1, half - lw - String(v1 ?? "N/A").length - 1),
    );
    const dots2 = ".".repeat(
      Math.max(1, half - lw - String(v2 ?? "N/A").length - 1),
    );
    const left = `${pad(l1, lw)} ${dots1} ${v1 ?? "N/A"}`;
    const right = `${pad(l2, lw)} ${dots2} ${v2 ?? "N/A"}`;
    return this.line(pad(left, half) + right);
  }

  rule(char = "─") {
    return this.line(rule(char));
  }

  dblRule() {
    return this.line(dblRule());
  }

  dottedRule() {
    return this.line(dottedRule());
  }

  /** Table row: array of { text, width, align } */
  tableRow(cols, opts = {}) {
    const { bold = false } = opts;
    let out = "";
    for (const col of cols) {
      out += pad(col.text ?? "", col.width, col.align ?? "L");
    }
    out = out.slice(0, WIDTH);
    if (bold) out = BOLD_ON + out + BOLD_OFF;
    return this.line(out);
  }

  /** Signature line: label on left, underline blanks on right */
  sigLine(label, lineLen = 30) {
    const under = "_".repeat(lineLen);
    return this.line(leftRight(label, under));
  }

  /** Write field label + blank fill line for manual entry */
  fillField(label, lineLen = 28) {
    const under = "_".repeat(lineLen);
    const lw = WIDTH - lineLen - 2;
    return this.line(`${pad(label, lw)}: ${under}`);
  }

  toString() {
    return this._buf;
  }
}

// ─── Main function ───────────────────────────────────────────────────────────

/**
 * autoPrintReceiptDotMatrix
 *
 * Sends a formatted Product Delivery Order to a dot matrix printer.
 * Accepts exactly the same database fields as the thermal version.
 *
 * @param {string|number} order_no
 * @param {object}        res        - Express response object
 * @param {object}        auth       - { id } of the logged-in user
 */
async function autoPrintReceiptDotMatrix(order_no, res, auth) {
  try {
    const user = await getUser(auth.id);
    const orderData = await PDFg.getprocesseddeliveryorders(order_no);

    if (!orderData || orderData.length === 0) {
      return res
        .status(404)
        .json({ error: `No delivery order found for order_no: ${order_no}` });
    }

    const {
      customer,
      supplier,
      product_type,
      packing_type,
      truck_no,
      trailler_no,
      tare_weight,
      gross_weight,
      net_weight,
      tare_time,
      gross_time,
      net_time,
      customer_code,
      driver,
      qty,
      destination,
      source,
      phone,
      avrg_weight,
      buying_center,
      purchase_type,
      dispatch_type,
    } = orderData[0];

    const quantity = qty ?? net_weight ?? null;
    const partyLabel = customer ? "Customer" : supplier ? "Supplier" : "Party";
    const partyValue = customer ?? supplier ?? "N/A";
    const printedBy = `${fmtName(user.first_name)} ${fmtName(user.last_name)}`;
    const now = fmtDate(new Date());

    // ── How many copies?  Dot matrix usually feeds 3-part NCR paper, so we
    //    loop 3 times (or pass `copies` param).  Adjust as needed.
    const COPIES = 3;
    const copyLabels = ["OFFICE COPY", "DRIVER COPY", "STORES COPY"];

    // ── Build the output for ALL copies in one pass ──────────────────────────
    const L = new Lines();
    L.raw(RESET); // initialise printer

    for (let copy = 0; copy < COPIES; copy++) {
      // ── TOP BORDER ──────────────────────────────────────────────────────────
      L.dblRule();

      // ── COMPANY HEADER ──────────────────────────────────────────────────────
      L.blank();
      L.header("ALLIANCE GINNERIES LIMITED", { bold: true, dw: copy === 0 });
      L.header("PRODUCT DELIVERY ORDER", { bold: true });
      L.blank();
      L.dblRule();

      // ── ORDER META ──────────────────────────────────────────────────────────
      L.blank();
      L.line(
        threeCol(
          `Order No: ${BOLD_ON}${order_no}${BOLD_OFF}`,
          "",
          `Printed: ${now}`,
        ),
      );
      L.line(
        threeCol(
          `Product: ${product_type ?? "N/A"}`,
          "",
          `[ ${copyLabels[copy]} ]`,
        ),
      );
      L.blank();
      L.rule("─");

      // ── BUYING CENTRE DETAILS ────────────────────────────────────────────────
      if (buying_center?.id) {
        L.blank();
        L.sectionHeading("Buying Centre Details");
        L.rule("─");
        L.kvDouble(
          "Zone",
          buying_center.village ?? "N/A",
          "District",
          buying_center.district ?? "N/A",
        );
        L.kv(
          "Centre",
          `${buying_center.code ?? "N/A"} – ${buying_center.title ?? "N/A"}`,
        );
        L.kv("Cotton Type", getCottonTypeCode(buying_center));
        L.rule("─");
      }

      // ── VEHICLE INFORMATION ──────────────────────────────────────────────────
      L.blank();
      L.sectionHeading("Vehicle Information");
      L.rule("─");
      L.kv("Transporter", "AGL");
      L.kv("Vehicle Make", "Merc/Scania/?");
      L.blank();

      //  Type | Reg No | Tare Weight
      L.tableRow(
        [
          { text: "TYPE", width: 14, align: "L" },
          { text: "REGISTRATION NO.", width: 34, align: "L" },
          { text: "TARE WEIGHT (KG)", width: 32, align: "R" },
        ],
        { bold: true },
      );
      L.rule("·");

      L.tableRow([
        { text: "Lorry", width: 14, align: "L" },
        { text: truck_no ?? "N/A", width: 34, align: "L" },
        { text: fmt(tare_weight), width: 32, align: "R" },
      ]);
      L.tableRow([
        { text: "Trailer", width: 14, align: "L" },
        { text: trailler_no ?? "?", width: 34, align: "L" },
        { text: "?", width: 32, align: "R" },
      ]);
      L.rule("─");

      // ── DRIVER INFORMATION ───────────────────────────────────────────────────
      L.blank();
      L.sectionHeading("Driver Information");
      L.rule("─");
      L.kvDouble("Name", driver ?? "N/A", "Phone", phone ?? "N/A");
      L.kv("DL / ID No.", "");
      L.kv("Assigned By", "");
      L.rule("─");

      // ── PRODUCT DETAILS ──────────────────────────────────────────────────────
      L.blank();
      L.sectionHeading("Product Details");
      L.rule("─");
      L.tableRow(
        [
          { text: "PRODUCT", width: 52, align: "L" },
          { text: "PKG TYPE", width: 16, align: "L" },
          { text: "QTY", width: 12, align: "R" },
        ],
        { bold: true },
      );
      L.rule("·");
      L.tableRow([
        { text: product_type ?? "N/A", width: 52, align: "L" },
        { text: packing_type ?? "N/A", width: 16, align: "L" },
        {
          text: quantity != null ? String(parseInt(quantity)) : "N/A",
          width: 12,
          align: "R",
        },
      ]);
      L.rule("─");

      // ── WEIGHT DETAILS ───────────────────────────────────────────────────────
      L.blank();
      L.sectionHeading("Weight Details");
      L.rule("─");
      L.tableRow(
        [
          { text: "WEIGHING", width: 12, align: "L" },
          { text: "KG", width: 18, align: "R" },
          { text: "DATE / TIME", width: 50, align: "R" },
        ],
        { bold: true },
      );
      L.rule("·");
      L.tableRow([
        { text: "First (Tare)", width: 12, align: "L" },
        { text: fmt(tare_weight), width: 18, align: "R" },
        { text: fmtDate(tare_time), width: 50, align: "R" },
      ]);
      L.tableRow([
        { text: "Second (Gross)", width: 12, align: "L" },
        {
          text: gross_weight ? fmt(gross_weight) : "-",
          width: 18,
          align: "R",
        },
        {
          text: gross_weight ? fmtDate(gross_time) : "-",
          width: 50,
          align: "R",
        },
      ]);
      L.tableRow([
        { text: "Net Weight", width: 12, align: "L" },
        { text: net_weight ? fmt(net_weight) : "-", width: 18, align: "R" },
        { text: net_weight ? fmtDate(gross_time) : "-", width: 50, align: "R" },
      ]);

      if (avrg_weight) {
        L.rule("·");
        L.tableRow([
          { text: "Avg / Bag", width: 12, align: "L" },
          { text: fmt(avrg_weight), width: 18, align: "R" },
          { text: "", width: 50, align: "R" },
        ]);
      }
      L.rule("─");

      // ── MORE DETAILS ─────────────────────────────────────────────────────────
      L.blank();
      L.sectionHeading("More Details");
      L.rule("─");
      L.kv("Destination", destination ?? "N/A");
      L.kv("Source", source ?? "N/A");
      L.kv("Purchase Type", purchase_type ?? "N/A");
      L.kv("Dispatch Type", dispatch_type ?? "N/A");
      L.kv(partyLabel, partyValue);
      L.rule("─");

      // ── OFFLOADING CONFIRMATION (only when no net weight yet) ────────────────
      if (!net_weight) {
        L.blank();
        L.sectionHeading("Offloading Confirmation");
        L.rule("─");
        L.blank();
        L.fillField("Product");
        L.blank();
        L.fillField("Grade Type");
        L.blank();
        L.fillField("Location");
        L.blank();
        L.fillField("Vehicle Reg. No");
        L.blank();
        L.fillField("Qty Offloaded (Lorry Bags)");
        L.blank();
        L.fillField("Total Qty (Trailer Bags)");
        L.blank();
        L.fillField("Total Qty Offloaded");
        L.blank();
        // Time offloaded: special two-part field
        L.line(
          `${"Time Offloaded".padEnd(WIDTH - 28)}: Hrs: ______   Mins: ______`,
        );
        L.blank(2);
        L.sigLine("Stores Signature");
        L.rule("─");
      }

      // ── FOOTER ───────────────────────────────────────────────────────────────
      L.blank();
      L.line(center("─── Authorized Signatures ───"));
      L.blank(2);
      L.sigLine("Transport Officer");
      L.blank(2);
      L.sigLine("Driver Signature");
      L.blank();
      L.dblRule();
      L.blank();
      L.line(
        center(`Printed by: ${BOLD_ON}${printedBy}${BOLD_OFF}   |   ${now}`),
      );
      L.blank();
      L.dblRule();

      // ── FORM FEED between copies ─────────────────────────────────────────────
      L.raw(FF);
    }

    // ── Send to printer ──────────────────────────────────────────────────────
    // For a dot matrix on a serial/parallel port you typically do:
    //
    //   const { SerialPort } = require('serialport');
    //   const port = new SerialPort({ path: '/dev/ttyS0', baudRate: 9600 });
    //   port.write(Buffer.from(L.toString(), 'binary'), (err) => { … });
    //
    // Or for an LPT / USB raw port:
    //   const fs = require('fs');
    //   fs.writeFileSync('/dev/usb/lp0', L.toString(), { encoding: 'binary' });
    //
    // Below we use the same escpos-network driver pattern as the thermal version
    // so the caller can swap only the transport layer:

    const device = new escposNetwork(
      printerConfig.DOT_MATRIX_IP ?? printerConfig.IP_ADDRESS,
    );

    device.open((err) => {
      if (err) {
        console.error("DOT MATRIX :: device open error", err);
        return res.status(500).json({
          error: "Failed to open dot matrix printer",
          details: err.message,
        });
      }

      device.write(Buffer.from(L.toString(), "binary"), (writeErr) => {
        device.close();
        if (writeErr) {
          console.error("DOT MATRIX :: write error", writeErr);
          return res.status(500).json({
            error: "Failed to write to dot matrix printer",
            details: writeErr.message,
          });
        }
        console.log(`DOT MATRIX :: printed order ${order_no} — 3 copies`);
      });
    });

    return res.json({
      success: true,
      message: "Dot matrix receipt sent to printer!",
    });
  } catch (error) {
    console.error("Error printing dot matrix receipt:", error);
    return res.status(500).json({
      error: "Failed to print dot matrix receipt",
      details: error.message,
    });
  }
}

module.exports = { autoPrintReceiptDotMatrix };
