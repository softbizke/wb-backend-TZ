const PDFg = require("../services/pdfService");
const fs = require("fs");
const path = require("path");
const escpos = require("escpos");
const { USB } = require("escpos-usb");
const sharp = require("sharp");
const escposNetwork = require("escpos-network");
const QRCode = require("qrcode");
const { DateTime } = require("luxon");
const { getUser } = require("../services/usersService");
const printerConfig = require("../config/printerConfig");

async function generatePDFHandler(req, res) {
  const { order_no } = req.query;

  if (!order_no || typeof order_no !== "string" || order_no.trim() === "") {
    return res
      .status(400)
      .json({ error: "Invalid or missing order_no parameter" });
  }

  try {
    // Retrieve processed delivery order data
    const pdfdata = await PDFg.getprocesseddeliveryorders(order_no);

    if (!pdfdata || pdfdata.length === 0) {
      return res
        .status(404)
        .json({ error: `No delivery order found for order_no: ${order_no}` });
    }

    // Extract the first record from the data (assuming one order per request)
    const {
      customer,
      producttype,
      packingtype,
      truck_no,
      trailler_no,
      tare_weight,
      gross_weight,
      net_weight,
      tare_time, // Assuming you have these fields in the database
      gross_time, // Assuming you have these fields in the database
      net_time,
    } = pdfdata[0];

    // Helper function to format dates
    const formatDate = (date) => {
      if (!date) return "N/A";
      const options = {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      };
      return new Intl.DateTimeFormat("en-GB", options).format(new Date(date));
    };

    // Create PDF_DATA with updated values
    const PDF_DATA = {
      receiptId: order_no,
      ticket_number: order_no,
      delivery: "WEIGHT",
      TARE_TIME: tare_time ? formatDate(tare_time) : "N/A",
      TARE_WEIGHT: tare_weight ? `${Number.parseInt(tare_weight)}` : "N/A",
      GROSS_TIME: gross_time ? formatDate(gross_time) : "N/A",
      GROSS_WEIGHT: gross_weight ? `${Number.parseInt(gross_weight)}` : "N/A",
      NET_WEIGHT: net_weight ? `${Number.parseInt(net_weight)}` : "N/A",
      NET_TIME: net_time ? `${net_time}` : "N/A",
      operator: "JOHN DOE", // Placeholder; update with actual operator if needed
      groups: [
        {
          name: "CUSTOMER ",
          items: [
            { description: "CUSTOMER", qty: customer || "N/A" },
            { description: "PRODUCT", qty: producttype || "N/A" },
            { description: "PACKING TYPE", qty: packingtype || "N/A" },
          ],
        },
        {
          name: "TRUCK ",
          items: [
            { description: "TRUCK NO", qty: truck_no || "N/A" },
            { description: "TRAILER NO", qty: trailler_no || "N/A" },
          ],
        },
      ],
    };

    //console.log("Generated PDF Data:", PDF_DATA);

    // Generate and send the PDF
    // res.setHeader('Content-Type', 'application/pdf');
    // res.setHeader('Content-Disposition', `attachment; filename="delivery_order_${order_no}.pdf"`);
    // await PDFg.generatePDF(order_no,PDF_DATA, res);
    await PDFg.generatePDF(order_no, PDF_DATA, res);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({
      error: "An error occurred while generating the PDF",
      details: error.message,
    });
  }
}
async function generateReceiptHandler(req, res) {
  const { order_no } = req.query;

  if (!order_no || typeof order_no !== "string" || order_no.trim() === "") {
    return res
      .status(400)
      .json({ error: "Invalid or missing order_no parameter" });
  }

  await autoPrintReceipt(order_no, res, req.user);
}
async function autoPrintReceipt(order_no, res, auth) {
  try {
    const user = await getUser(auth.id);

    const orderData = await PDFg.getprocesseddeliveryorders(order_no);
    if (!orderData || orderData.length === 0) {
      return res
        .status(404)
        .json({ error: `No delivery order found for order_no: ${order_no}` });
    }

    console.log("PRINT:: ", orderData[0]);
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
      phone,
      avrg_weight,
      buying_center,
      offloading_location,
    } = orderData[0];
    // Format date
    const formatDate = (date) => {
      return DateTime.fromJSDate(new Date(date)).toFormat("dd-LL-yyyy HH:mm");
    };
    const logoPath = path.join(__dirname, "./logo.png");
    const resizedPath = path.join(__dirname, "tmp", "logo-resized.png");

    const avrg = avrg_weight;
    // ? avrg_weight
    // : net_weight && qty
    // ? net_weight / qty
    // : null;
    const options = { encoding: "GB18030" /* default */ };
    const device = new escposNetwork(printerConfig.IP_ADDRESS);
    const printer = new escpos.Printer(device, options);
    const quantity = qty ? qty : net_weight ? net_weight : null;

    //printer

    sharp(logoPath)
      .resize({ height: 150 })
      .toFile(resizedPath)
      .then(() => {
        escpos.Image.load(resizedPath, function (image) {
          console.log("ES IMG", image);
          device.open(() => {
            printer
              .align("CT")
              .raster(image)
              .align("CT")
              .style("B")
              .size(0, 0)
              // .text("ALLIANCE GINNERY LTD")
              .style("NORMAL")
              .text("P.O. BOX 11074, MWANZA, TANZANIA")
              .text(`Date: ${DateTime.now().toFormat("dd-LL-yyyy HH:mm")}`)

              .text("Phone: +254 700 000 000")
              .newLine()
              .align("CT")
              .style("B")
              .text("WEIGHBRIDGE PASS TICKET")
              .style("NORMAL")
              .drawLine()

              //ticket number
              .align("CT")
              .style("NORMAL")
              .text(`Ticket No: ${order_no}`)
              .drawLine()
              .newLine();

            // buying center details
            if (buying_center?.id) {
              printer
                .align("LT")
                .style("B")
                .text("BUYING CENTER DETAILS")
                .drawLine()
                .style("NORMAL")
                .text(`Zone : ${buying_center.village ?? "N/A"}`)
                .text(`Center : ${buying_center.title ?? "N/A"}`)
                .text(
                  `Cotton Type : ${buying_center.cotton_type ? (buying_center.cotton_type.toLowerCase() === "organic" ? "01" : "02") : "N/A"}`,
                )
                .drawLine()
                .newLine();
            }

            //truck details
            printer
              .align("LT")
              .style("B")
              .text("TRUCK DETAILS")
              .drawLine()
              .style("NORMAL")
              .text(`Truck No: ${truck_no}`)
              .text(`Driver : ${driver ?? "N/A"}`)
              // .text(`Contact : N/A`)
              .newLine()
              .newLine()
              //product details
              .align("LT")
              .style("B")
              .text("PRODUCT DETAILS")
              .drawLine()
              .align("LT")
              .tableCustom(
                [
                  { text: "PRODUCT", align: "LEFT", width: 0.8 },
                  // { text: "TYPE", align: "CENTER", width: 0.2 },
                  { text: "QTY", align: "RIGHT", width: 0.2 },
                ],
                { encoding: "cp857", size: [1, 1] }, // Optional
              )
              .drawLine()
              .style("NORMAL")
              .tableCustom(
                [
                  {
                    text: product_type ?? "N/A",
                    align: "LEFT",
                    width: 0.8,
                  },
                  // {
                  //   text: "BAGS",
                  //   align: "CENTER",
                  //   width: 0.2,
                  // },
                  {
                    text: parseInt(quantity ?? "") ?? "NA",
                    align: "RIGHT",
                    width: 0.2,
                  },
                ],
                { encoding: "cp857", size: [1, 1] }, // Optional
              )
              .newLine()
              .newLine()
              //avarage weight
              // .align("LT")
              // .style("B")
              // .text("AVERAGE WEIGHT")
              // .drawLine()
              // .style("NORMAL")
              // .text(
              //   `${
              //     net_weight && qty
              //       ? `Average Weight: ${Number(
              //           Number.parseFloat(net_weight) / Number.parseFloat(qty),
              //         ).toFixed(2)} KG`
              //       : "N/A"
              //   }`,
              // )
              // .newLine()
              // .newLine()
              //weight details
              .align("LT")
              .style("B")
              .text("WEIGHT DETAILS")
              .drawLine()
              .table(["TYPE", "KG(s)", "TIME"])
              .drawLine()
              .style("NORMAL")
              .table([
                "First",
                Number.parseInt(tare_weight),
                formatDate(tare_time),
              ])
              .table([
                "Second",
                gross_weight ? Number.parseInt(gross_weight) : "-",
                gross_weight ? formatDate(gross_time) : "-",
              ])
              .table([
                "Net",
                net_weight ? Number.parseInt(net_weight) : "-",
                net_weight ? formatDate(gross_time) : "-",
              ])
              .drawLine()
              //customer details
              .newLine()
              .newLine()
              .align("LT")
              .style("B")
              .text("MORE DETAILS")
              .drawLine()
              .style("NORMAL")
              .text(`Destination:  ${destination ?? "N/A"}`)
              .text(
                `${customer ? "Customer" : supplier ? "Supplier" : "Party"}:  ${customer ?? supplier ?? "N/A"}`,
              );

            if (!net_weight) {
              //if netweight is not available it means we are on first weight so we show the offloading confirmation template
              printer
                .drawLine()
                .align("CT")
                .newLine()
                .newLine()
                .align("LT")
                .style("B")
                .text("OFFLOADING CONFIRMATION")
                .drawLine()
                .style("NORMAL")
                .newLine()
                .newLine()
                .tableCustom(
                  [
                    { text: "Product", align: "LEFT", width: 0.45 },
                    {
                      text: "________________________",
                      align: "RIGHT",
                      width: 0.55,
                    },
                  ],
                  { encoding: "cp857", size: [1, 1] },
                )
                .newLine()
                .newLine()

                .tableCustom(
                  [
                    { text: "Grade Type", align: "LEFT", width: 0.45 },
                    {
                      text: "________________________",
                      align: "RIGHT",
                      width: 0.55,
                    },
                  ],
                  { encoding: "cp857", size: [1, 1] },
                )
                .newLine()
                .newLine()

                .tableCustom(
                  [
                    { text: "Location", align: "LEFT", width: 0.45 },
                    {
                      text: "________________________",
                      align: "RIGHT",
                      width: 0.55,
                    },
                  ],
                  { encoding: "cp857", size: [1, 1] },
                )
                .newLine()
                .newLine()

                .tableCustom(
                  [
                    { text: "Vehicle Reg. No", align: "LEFT", width: 0.45 },
                    {
                      text: "________________________",
                      align: "RIGHT",
                      width: 0.55,
                    },
                  ],
                  { encoding: "cp857", size: [1, 1] },
                )
                .newLine()
                .newLine()

                .tableCustom(
                  [
                    {
                      text: "Qty Offloaded (Lorry Bags)",
                      align: "LEFT",
                      width: 0.45,
                    },
                    {
                      text: "________________________",
                      align: "RIGHT",
                      width: 0.55,
                    },
                  ],
                  { encoding: "cp857", size: [1, 1] },
                )
                .newLine()

                .tableCustom(
                  [
                    {
                      text: "Total Qty (Trailer Bags)",
                      align: "LEFT",
                      width: 0.45,
                    },
                    {
                      text: "________________________",
                      align: "RIGHT",
                      width: 0.55,
                    },
                  ],
                  { encoding: "cp857", size: [1, 1] },
                )
                .newLine()

                .tableCustom(
                  [
                    {
                      text: "Total Qty Offloaded",
                      align: "LEFT",
                      width: 0.45,
                    },
                    {
                      text: "________________________",
                      align: "RIGHT",
                      width: 0.55,
                    },
                  ],
                  { encoding: "cp857", size: [1, 1] },
                )
                .newLine()
                .newLine()

                .tableCustom(
                  [
                    {
                      text: "Time Offloaded",
                      align: "LEFT",
                      width: 0.45,
                    },
                    {
                      text: "Hrs:_____ Mins:_____",
                      align: "RIGHT",
                      width: 0.55,
                    },
                  ],
                  { encoding: "cp857", size: [1, 1] },
                )
                .newLine()
                .newLine()

                .tableCustom(
                  [
                    {
                      text: "Stores Signature",
                      align: "LEFT",
                      width: 0.45,
                    },
                    {
                      text: "________________________",
                      align: "RIGHT",
                      width: 0.55,
                    },
                  ],
                  { encoding: "cp857", size: [1, 1] },
                );
            }

            printer
              .newLine()
              .newLine()
              .drawLine()
              .newLine()
              .align("CT")
              .text(`Printed by: ${user.first_name} ${user.last_name}`)
              .newLine()
              .cut()
              .close();

            // .text("Scan QR Code for Order Details") // ✅ Added text above QR Code
            // .qrimage(order_no, function (err) {
            //   // Generate QR Code with Order No
            //   if (err) {
            //     console.error("Error generating QR Code:", err);
            //   }
            //   printer
            //     .newLine()
            //     .align("CT")
            //     .text(`Printed by: ${user.first_name} ${user.last_name}`)
            //     .newLine()
            //     .cut()
            //     .close();
            // });
          });
        });
      });

    res.json({ success: true, message: "Receipt printed successfully!" });
  } catch (error) {
    console.error("Error printing receipt:", error);
    res
      .status(500)
      .json({ error: "Failed to print receipt", details: error.message });
  }
}
function formatTableRow(type, weight, time) {
  const typeColumn = type.padEnd(10, " "); // Align "First", "Second", "Net"
  const weightColumn = String(weight).padEnd(8, " "); // Align weight values
  const timeColumn = time.padEnd(8, " "); // Show HH:MM only
  return `${typeColumn}${weightColumn}${timeColumn}`;
}

module.exports = {
  generatePDFHandler,
  generateReceiptHandler,
  autoPrintReceipt,
};
