const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");
const { Pool } = require("pg");
const { dbConfig } = require("../config/dbConfig");
const axios = require("axios"); // Ensure axios is installed for fetching the image
const fs = require("fs");
const path = require("path");
const escpos = require("escpos");
const { USB } = require("escpos-usb");
const sharp = require("sharp");

// Create a connection pool
const pool = new Pool({
  user: dbConfig.user,
  host: dbConfig.host,
  database: dbConfig.database,
  password: dbConfig.password,
  port: dbConfig.port,
});

// Utility function to add a group of items with a description and separator
function addGroupOfItems(doc, startY, groupName, items) {
  doc.font("Helvetica-Bold").fontSize(8).text(groupName, 10, startY); // Adjusted for 80mm width

  const separatorY = startY + 15;
  doc
    .moveTo(10, separatorY)
    .lineTo(210, separatorY) // Adjusted for 80mm width
    .stroke();

  let currentY = separatorY + 10;
  items.forEach((item) => {
    doc
      .font("Helvetica")
      .fontSize(8) // Reduced font size for 80mm paper
      .text(item.description, 10, currentY)
      .text(item.qty.toString(), 50, currentY, { width: 150, align: "right" }); // Adjusted for 80mm width
    currentY += 15;
  });

  return currentY + 10;
}

// Function to add a group of items with a description and separator
function addGroupOfFItems(doc, startY, groupName, items) {
  doc.font("Helvetica-Bold").fontSize(8).text(groupName, 10, startY); // Adjusted for 80mm width

  const separatorY = startY + 15;
  doc
    .moveTo(10, separatorY)
    .lineTo(210, separatorY) // Adjusted for 80mm width
    .stroke();

  let currentY = separatorY + 10;

  // Column Headers for Product, Packing, Unit, Qty, Weight
  const col1X = 10,
    col2X = 70,
    col3X = 110,
    col4X = 130,
    col5X = 160;
  const col1Width = 60,
    col2Width = 40,
    col3Width = 40,
    col4Width = 30,
    col5Width = 40;

  // Header Text
  doc
    .font("Helvetica")
    .fontSize(8)
    .text("Product", col1X, currentY, { width: col1Width, align: "left" })
    .text("Packing", col2X, currentY, { width: col2Width, align: "left" })
    .text("Unit", col3X, currentY, { width: col3Width, align: "left" })
    .text("Qty", col4X, currentY, { width: col4Width, align: "right" })
    .text("Weight", col5X, currentY, { width: col5Width, align: "right" });

  currentY += 15; // Move down to add item rows

  // Function to wrap text if it's too long for a given column width
  function wrapText(doc, text, x, y, maxWidth) {
    const lines =
      doc.widthOfString(text, { width: maxWidth }) > maxWidth
        ? text.split(" ")
        : [text];
    let line = "";
    let lineY = y;

    lines.forEach((word) => {
      const testLine = line + word + " ";
      const testWidth = doc.widthOfString(testLine);
      if (testWidth > maxWidth) {
        doc.text(line, x, lineY);
        line = word + " "; // Start a new line
        lineY += 12; // Move to the next line
      } else {
        line = testLine;
      }
    });
    doc.text(line, x, lineY); // Final line
    return lineY; // Return the Y position after writing the text
  }

  // Add items data below headers, spacing columns evenly
  items.forEach((item) => {
    let currentRowY = currentY; // Save the current Y position

    // Wrap and print each item field
    currentRowY = wrapText(doc, item.product, col1X, currentRowY, col1Width);
    currentRowY = wrapText(doc, item.packing, col2X, currentRowY, col2Width);
    currentRowY = wrapText(doc, item.unit, col3X, currentRowY, col3Width);
    doc.text(item.qty ? item.qty.toString() : "N/A", col4X, currentRowY, {
      width: col4Width,
      align: "right",
    });
    doc.text(item.weight ? item.weight.toString() : "N/A", col5X, currentRowY, {
      width: col5Width,
      align: "right",
    });

    currentY = currentRowY + 15; // Move down for next row
  });

  return currentY + 10; // Add some space after the last item
}

// Function to check if the delivery order exists in `tos_finished_orders`
async function getAdditionalLoadingDetails(order_no) {
  try {
    const query = `
            select
            prod.name as product,
            packt.name as packing,
            pack.name as unit,
            fin.measurement as qty,
            20 as weight
            from tos_finished_orders fin
            left join tos_product prod on prod.id = fin.product_id
            left join tos_packing_type packt on packt.id = fin.packing_type_id
            left join tos_packing pack on pack.id = CAST(fin.unit AS INT) 
            where fin.delivery_order_id = (SELECT id FROM tos_delivery_orders WHERE order_number = $1)
        `;
    const result = await pool.query(query, [order_no]);
    return result.rows; // Return additional loading details if available
  } catch (error) {
    console.error("Error fetching additional loading details:", error);
    throw new Error("Database error");
  }
}

// Function to check if the order exists in `tos_finished_orders`
async function checkOrderExists(order_no) {
  try {
    const query = `
            SELECT * 
            FROM tos_finished_orders 
            WHERE delivery_order_id = (SELECT id FROM tos_delivery_orders WHERE order_number = $1)
        `;
    const result = await pool.query(query, [order_no]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error("Error checking order existence:", error);
    throw new Error("Database error");
  }
}

// Core function to generate the PDF

async function generatePDF(order_no, data, res) {
  const orderDetails = await checkOrderExists(order_no);
  const additionalDetails = orderDetails
    ? await getAdditionalLoadingDetails(order_no)
    : [];

  const {
    delivery,
    TARE_TIME,
    TARE_WEIGHT,
    GROSS_TIME,
    GROSS_WEIGHT,
    NET_WEIGHT,
    groups,
    operator,
  } = data;
  const pdfPath = path.join(
    __dirname,
    `../../public/delivery_order_${order_no}.pdf`
  );
  const imagePath = path.join(
    __dirname,
    `../../public/delivery_order_${order_no}.png`
  );

  const logoURL =
    "https://kituiflourmills.co.ke/wp-content/themes/KFM/assets/images/kfm-logo.png";
  const logoPath = path.join(__dirname, "kfm-logo.png");

  // Set paper size to 80mm x 297mm (272.92 x 841.89 points)
  const doc = new PDFDocument({
    size: [80 * 2.83, 160 * 2.83], // 80mm x 210mm in points
    margins: { top: 5, left: 5, right: 5, bottom: 5 }, // Adjusted margins
  });
  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);
  // doc.pipe(res);

  const qrCodeData = await QRCode.toDataURL(order_no);

  let currentY = 10; // Start closer to the top
  // Fetch and Add Online Company Logo (Top Left)

  try {
    const response = await axios({ url: logoURL, responseType: "arraybuffer" });
    fs.writeFileSync(logoPath, response.data); // Save locally for usage

    const logoWidth = 50,
      logoHeight = 50;
    doc.image(logoPath, 10, currentY, { width: logoWidth, height: logoHeight });
  } catch (error) {
    console.log("Failed to fetch logo, skipping...");
  }
  const companyTextX = 70;
  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(" Kitui Flour Mills", companyTextX, currentY);
  currentY += 12;
  doc.fontSize(8).text("MOMBASA", companyTextX, currentY);
  currentY += 12;
  // doc.text('Gate Pass Ticket', companyTextX, currentY);
  currentY += 30;
  doc.text(
    "---------------------- Gate Pass Ticket --------------------",
    20,
    currentY
  );
  currentY += 20;

  const pageWidth = 272.92;

  // Ticket Number
  const ticketText = `Ticket No.: ${
    orderDetails ? orderDetails.ticket_number : "N/A"
  }`;
  const textWidth = doc.widthOfString(ticketText);
  const xPosition = pageWidth - textWidth - 75;
  doc.text(ticketText, 10, currentY);
  currentY += 20;

  // Add item groups
  groups.forEach((group) => {
    currentY = addGroupOfItems(doc, currentY, group.name, group.items);
  });

  // Additional Loading Details
  if (additionalDetails.length > 0) {
    const loadingGroupItems = additionalDetails.map((item) => ({
      product: item.product,
      packing: item.packing,
      unit: item.unit,
      qty: item.qty,
      weight: item.weight,
    }));
    currentY = addGroupOfFItems(doc, currentY, "LOADINGS", loadingGroupItems);
  }

  // Delivery Info
  doc.font("Helvetica-Bold").fontSize(8).text(delivery, 10, currentY);
  currentY += 15;

  // Draw Table
  let startX = 5,
    startY = currentY;
  let columnWidths = [50, 50, 110]; // Adjusted column widths
  let rowHeight = 15;

  function drawCell(doc, text, x, y, width, height, align = "left") {
    doc.rect(x, y, width, height).stroke();
    doc
      .fontSize(9)
      .text(text, x + 3, y + 3, { width: width - 6, align: align });
  }

  // Table Header Row
  drawCell(doc, "TYPE", startX, startY, columnWidths[0], rowHeight, "center");
  drawCell(
    doc,
    "KG(s)",
    startX + columnWidths[0],
    startY,
    columnWidths[1],
    rowHeight,
    "center"
  );
  drawCell(
    doc,
    "TIME",
    startX + columnWidths[0] + columnWidths[1],
    startY,
    columnWidths[2],
    rowHeight,
    "center"
  );
  startY += rowHeight;

  // Table Data Rows
  drawCell(doc, "FIRST", startX, startY, columnWidths[0], rowHeight, "center");
  drawCell(
    doc,
    TARE_WEIGHT,
    startX + columnWidths[0],
    startY,
    columnWidths[1],
    rowHeight,
    "center"
  );
  drawCell(
    doc,
    TARE_TIME,
    startX + columnWidths[0] + columnWidths[1],
    startY,
    columnWidths[2],
    rowHeight,
    "center"
  );
  startY += rowHeight;

  drawCell(doc, "SECOND", startX, startY, columnWidths[0], rowHeight, "center");
  drawCell(
    doc,
    GROSS_WEIGHT,
    startX + columnWidths[0],
    startY,
    columnWidths[1],
    rowHeight,
    "center"
  );
  drawCell(
    doc,
    GROSS_TIME,
    startX + columnWidths[0] + columnWidths[1],
    startY,
    columnWidths[2],
    rowHeight,
    "center"
  );
  startY += rowHeight;

  drawCell(doc, "NET", startX, startY, columnWidths[0], rowHeight, "center");
  drawCell(
    doc,
    NET_WEIGHT,
    startX + columnWidths[0],
    startY,
    columnWidths[1],
    rowHeight,
    "center"
  );
  drawCell(
    doc,
    " ",
    startX + columnWidths[0] + columnWidths[1],
    startY,
    columnWidths[2],
    rowHeight,
    "center"
  );
  currentY = startY + rowHeight + 10;

  // Ensure spacing before Driver Section
  currentY += 10;

  // Driver Signature Section
  doc.font("Helvetica").fontSize(8).text("DRIVER SIGNATURE", 10, currentY);
  currentY += 30; // Provide enough space for signature

  // QR Code Section
  const qrCodeWidth = 50,
    qrCodeHeight = 50;
  const qrCodeX = (220 - qrCodeWidth) / 2;

  doc.font("Helvetica").text("Scan the QR Code:", qrCodeX, currentY);
  doc.image(qrCodeData, qrCodeX, currentY + 10, {
    width: qrCodeWidth,
    height: qrCodeHeight,
  });

  doc.end();

  stream.on("finish", async () => {
    try {
      console.log("IMAGE PATH", imagePath);
      // Convert PDF to Image (EPOS printers support images, not PDFs)
      await sharp(pdfPath, { density: 300 })
        .resize(576) // Fit the width of a standard 80mm receipt printer
        .greyscale() // Convert to greyscale
        .threshold(128)
        .toFile(imagePath);

      // Connect to the EPOS Printer over TCP/IP
      const device = new escposNetwork("30.30.30.121"); // Replace with your printer’s IP
      const printer = new escpos.Printer(device);

      device.open(async function (err) {
        if (err) {
          return res
            .status(500)
            .json({ error: "Failed to connect to printer" });
        }

        // Print the image
        printer.align("ct").image("./kfm-logo.png", "d24", function () {
          printer.newLine().cut().close();
          res.json({ message: "Receipt printed successfully over network!" });

          // Delete temporary files
          setTimeout(() => {
            fs.unlinkSync(pdfPath);
            fs.unlinkSync(imagePath);
          }, 5000);
        });
      });
    } catch (printError) {
      res.status(500).json({
        error: "Failed to print receipt",
        details: printError.message,
      });
    }
  });
}

// Function to retrieve all processed delivery orders with mandatory search functionality
const getprocesseddeliveryorders = async (search) => {
  try {
    if (!search || String(search).trim() === "") {
      throw new Error("Search parameter is required and cannot be empty.");
    }

    const query = `
            SELECT 
                ord.truck_no,
                ord.trailler_no,
                ord.order_number,
                ord.product_type_id,
                ord.stock_transfer_code,

                cust.name AS customer,
                cust.bp_code AS customer_code,

                driv.name AS driver,
                driv.license_no AS phone,

                prodty.name AS product_type,
                packty.name AS packing_type,
                finished.measurement AS qty,
              
                act1.tare_weight AS tare_weight,
                act1.created_at AS tare_time,
                act1.qty AS net_weight,
                act1.gross_weight AS gross_weight,
                act1.sw_at as gross_time,
                act1.avrg_w AS avrg_weight
              
            FROM tos_delivery_orders ord
            LEFT JOIN tos_customer cust ON ord.customer_id = cust.id
            LEFT JOIN tos_finished_orders finished ON ord.id = finished.delivery_order_id
            LEFT JOIN tos_drivers driv ON  ord.driver_id = driv.id
            LEFT JOIN tos_product prodty ON finished.product_id = prodty.id
            LEFT JOIN tos_packing_type packty ON   ord.packing_type_id = packty.id
            LEFT JOIN tos_activities act1 ON ord.id = act1.delivery_order_id  AND act1.activity_type = 10
            LEFT JOIN tos_activities act2 ON ord.id = act2.delivery_order_id AND act2.activity_type = 20
            WHERE ord.order_number LIKE $1;
        `;
    const { rows } = await pool.query(query, [`%${search}%`]);

    //if rows[0].product_type_id is not null,while proudct_type is null , get the product from tos_product, assing to rows[0].product_type
    for (let row of rows) {
      if (row.product_type_id && !row.product_type) {
        const productQuery = `
          SELECT name FROM tos_product_type WHERE id = $1;
        `;
        const productResult = await pool.query(productQuery, [row.product_type_id]);
        if (productResult.rows.length > 0) {
          row.product_type = productResult.rows[0].name;
        }
      }
    }

    return rows;
  } catch (err) {
    console.error("Error fetching processed delivery orders:", err);
    throw new Error("Error fetching processed delivery orders");
  }
};

module.exports = {
  generatePDF,
  getprocesseddeliveryorders,
};
