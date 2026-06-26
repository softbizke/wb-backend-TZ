/**
 * generateDeliveryOrderPDF.js
 * Alliance Ginneries Limited — Product Delivery Order
 *
 * Install: npm install pdfkit
 */

const PDFDocument = require("pdfkit");

// ── Helpers ───────────────────────────────────────────────────────────────────

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

const fmtWeight = (v) =>
  v != null
    ? Number(v).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "N/A";

const getCottonTypeCode = (bc) => bc?.cotton_type ?? bc?.type ?? "N/A";

// ── Single copy renderer ──────────────────────────────────────────────────────

function drawCopy(doc, data, user, startY, copyH, copyLabel) {
  const {
    order_number,
    product_type,
    packing_type,
    truck_no,
    trailler_no,
    tare_weight,
    gross_weight,
    net_weight,
    tare_time,
    gross_time,
    driver,
    phone,
    qty,
    destination,
    source,
    purchase_type,
    dispatch_type,
    customer,
    supplier,
    buying_center,
    avrg_weight,
    sw_at,
    activity_updated_at,
  } = data;

//   console.log("Generating PDF for order:", data);

  const partyLabel = customer ? "Customer" : supplier ? "Supplier" : "Party";
  const partyValue = customer ?? supplier ?? "N/A";
  const quantity = qty ?? net_weight ?? null;
  const printedBy = user
    ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim()
    : "System";

  // ── Layout constants ───────────────────────────────────────────────────────
  const L = 36; // left margin
  const R = 559; // right edge
  const W = R - L; // usable width
  const MID = L + W / 2;
  const ROW_H = 14; // standard row height — gives breathing room between rows
  const FS = 7.5; // base font size
  const FS_LABEL = 7; // slightly smaller for field labels

  let y = startY + 6;

  // ── Outer border ──────────────────────────────────────────────────────────
  doc
    .rect(L - 4, startY, W + 8, copyH - 3)
    .lineWidth(0.6)
    .stroke();

  // ── Copy label — top right ─────────────────────────────────────────────────
  doc.font("Helvetica").fontSize(6.5).fillColor("black");
  doc.text(`[ ${copyLabel} ]`, L, y + 1, { width: W, align: "right" });

  // ── Company header ─────────────────────────────────────────────────────────
  doc.font("Helvetica-Bold").fontSize(11);
  doc.text("ALLIANCE GINNERIES LIMITED", L, y, { width: W, align: "center" });
  y += 14;
  doc.font("Helvetica-Bold").fontSize(9);
  doc.text("PRODUCT DELIVERY ORDER", L, y, { width: W, align: "center" });
  y += 12;

  doc.moveTo(L, y).lineTo(R, y).lineWidth(0.5).stroke();
  y += 6;

  // ── Product row ────────────────────────────────────────────────────────────
  doc.font("Helvetica-Bold").fontSize(FS);
  doc.text("Product:", L, y, { continued: false });
  doc.font("Helvetica").fontSize(FS);
  doc.text(product_type ?? "Cotton/Rice Paddy/Ungraded Rice/ETC", L + 46, y);
  y += ROW_H;

  // ── Order No | Date | Time ─────────────────────────────────────────────────
  const orderDateTime = fmtDate(sw_at ?? activity_updated_at ?? new Date());
  const orderDateOnly = orderDateTime.split(" ")[0] ?? "N/A";
  const orderTimeOnly = orderDateTime.split(" ")[1] ?? "N/A";

  doc.font("Helvetica").fontSize(FS_LABEL).fillColor("black");
  doc.text("Order Number", L, y);
  doc.font("Helvetica-Bold").fontSize(FS);
  doc.text(String(order_number ?? "N/A"), L + 70, y);

  doc.font("Helvetica").fontSize(FS_LABEL);
  doc.text("Date", MID - 28, y);
  doc.font("Helvetica").fontSize(FS);
  doc.text(orderDateOnly, MID - 4, y);

  doc.font("Helvetica").fontSize(FS_LABEL);
  doc.text("Time", R - 75, y);
  doc.font("Helvetica").fontSize(FS);
  doc.text(orderTimeOnly, R - 52, y);
  y += ROW_H;

  // ── Buying Centre | Village ────────────────────────────────────────────────
  doc.font("Helvetica").fontSize(FS_LABEL);
  doc.text("Buying Centre", L, y);
  doc.font("Helvetica").fontSize(FS);
  doc.text(
    `${buying_center?.code ?? "N/A"} - ${buying_center?.title ?? "N/A"}  `,
    L + 70,
    y,
  );

  doc.font("Helvetica").fontSize(FS_LABEL);
  doc.text("Zone", MID - 28, y);
  doc.font("Helvetica").fontSize(FS);
  doc.text(buying_center?.village ?? "N/A", MID - 4, y);

  //   doc.font("Helvetica").fontSize(FS_LABEL);
  //   doc.text("Zone", R - 75, y);
  //   doc.font("Helvetica").fontSize(FS);
  //   doc.text(buying_center?.village ?? "N/A", R - 48, y);
  y += 8;

  doc.moveTo(L, y).lineTo(R, y).lineWidth(0.3).dash(2, { space: 2 }).stroke();
  doc.undash();
  y += 6;

  // ── VEHICLE INFORMATION ────────────────────────────────────────────────────
  doc.font("Helvetica-Bold").fontSize(FS);
  doc.text("VEHICLE INFORMATION", L, y);
  y += ROW_H;

  // Transporter | Vehicle Make
  doc.font("Helvetica").fontSize(FS_LABEL);
  doc.text("Transporter", L, y);
  doc.font("Helvetica").fontSize(FS);
  doc.text("AGL", L + 70, y);

  //   doc.font("Helvetica").fontSize(FS_LABEL);
  //   doc.text("Vehicle Make", MID - 28, y);
  //   doc.font("Helvetica").fontSize(FS);
  //   doc.text("Merc/Scania/?", MID + 20, y);
  y += ROW_H + 2;

  // Type / Registration No. / Tare Weight — bordered header row
  const vCol1 = L; // Type
  const vCol2 = L + 120; // Registration No.
  const vCol3 = L + 310; // Tare Weight

  doc.rect(vCol1, y, 110, ROW_H).lineWidth(0.4).stroke();
  doc.rect(vCol2, y, 180, ROW_H).lineWidth(0.4).stroke();

  doc.font("Helvetica-Bold").fontSize(FS_LABEL);
  doc.text("Type", vCol1 + 4, y + 3);
  doc.text("Registration No.", vCol2 + 4, y + 3);
  doc.text("Net Weight", vCol3, y + 3);
  y += ROW_H;

  // Lorry row
  doc.font("Helvetica").fontSize(FS);
  doc.text("Lorry", vCol1, y + 2);
  doc.text(truck_no ?? "N/A", vCol2, y + 2);
  doc.text(net_weight ? fmtWeight(net_weight) : "N/A", vCol3, y + 2);
  y += ROW_H;

  // Trailer row
  doc.text("Trailer", vCol1, y + 2);
  doc.text(trailler_no ?? "N/A", vCol2, y + 2);
  doc.text("", vCol3, y + 2);
  y += ROW_H + 2;

  doc.moveTo(L, y).lineTo(R, y).lineWidth(0.3).dash(2, { space: 2 }).stroke();
  doc.undash();
  y += 6;

  // ── DRIVER INFORMATION ─────────────────────────────────────────────────────
  doc.font("Helvetica-Bold").fontSize(FS);
  doc.text("DRIVER INFORMATION", L, y);
  y += ROW_H;

  // Name | DL/ID No | Phone
  doc.font("Helvetica").fontSize(FS_LABEL);
  doc.text("Name", L, y);
  doc.font("Helvetica").fontSize(FS);
  doc.text(driver ?? "N/A", L + 36, y);

  doc.font("Helvetica").fontSize(FS_LABEL);
  doc.text("DL/ID No:", MID - 28, y);
  doc
    .moveTo(MID + 28, y + 10)
    .lineTo(MID + 130, y + 10)
    .lineWidth(0.4)
    .stroke();

  doc.font("Helvetica").fontSize(FS_LABEL);
  doc.text("Phone", R - 75, y);
  doc.font("Helvetica").fontSize(FS);
  doc.text(phone ?? "N/A", R - 50, y);
  y += ROW_H + 2;

  // Assigned By
  doc.font("Helvetica-Bold").fontSize(FS);
  doc.text("Assigned By", L, y);
  y += ROW_H + 6;

  // Signature lines
  doc
    .moveTo(L, y)
    .lineTo(L + 170, y)
    .lineWidth(0.5)
    .stroke();
  doc
    .moveTo(MID + 50, y)
    .lineTo(R, y)
    .lineWidth(0.5)
    .stroke();
  y += 4;

  doc.font("Helvetica").fontSize(FS_LABEL);
  doc.text("Transport Officer", L, y);
  doc.text("Driver signature", MID + 50, y);
  y += ROW_H;

  // ── Printed by footer ──────────────────────────────────────────────────────
  doc.moveTo(L, y).lineTo(R, y).lineWidth(0.3).stroke();
  y += 4;
  doc.font("Helvetica").fontSize(6.5);
  doc.text(`Printed by: ${printedBy}   |   ${fmtDate(new Date())}`, L, y, {
    width: W,
    align: "center",
  });
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * generateDeliveryOrderPDF
 *
 * @param {object}   orderRow  - single row from getprocesseddeliveryorders()
 * @param {object}   res       - Express response object (pass null for Buffer)
 * @param {object}   [user]    - { first_name, last_name }
 * @param {object}   [options]
 * @param {number}   [options.copies=3]
 * @param {string[]} [options.copyLabels]
 */
function generateDeliveryOrderPDF(orderRow, res, user = null, options = {}) {
  return new Promise((resolve, reject) => {
    const {
      copies = 3,
      copyLabels = ["OFFICE COPY", "DRIVER COPY", "STORES COPY"],
    } = options;

    const PAGE_H = 842;
    const MARGIN_TOP = 16;
    const MARGIN_BOTTOM = 16;
    const COPY_GAP = 8;
    const usableH = PAGE_H - MARGIN_TOP - MARGIN_BOTTOM;
    const copyH = Math.floor((usableH - (copies - 1) * COPY_GAP) / copies);

    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      info: {
        Title: `Delivery Order ${orderRow.order_number ?? ""}`,
        Author: "Alliance Ginneries Limited",
      },
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("error", reject);
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(chunks);
      if (res) {
        res.set({
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="delivery-order-${orderRow.order_number ?? "unknown"}.pdf"`,
          "Content-Length": pdfBuffer.length,
        });
        res.end(pdfBuffer);
      }
      resolve(pdfBuffer);
    });

    for (let i = 0; i < copies; i++) {
      const startY = MARGIN_TOP + i * (copyH + COPY_GAP);
      drawCopy(
        doc,
        orderRow,
        user,
        startY,
        copyH,
        copyLabels[i] ?? `COPY ${i + 1}`,
      );
    }

    doc.end();
  });
}

module.exports = { generateDeliveryOrderPDF };
