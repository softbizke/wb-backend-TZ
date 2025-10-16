const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const { Pool } = require("pg");
const { dbConfig } = require("../config/dbConfig");

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
    doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(groupName, 50, startY);

    const separatorY = startY + 15;
    doc
        .moveTo(50, separatorY)
        .lineTo(550, separatorY)
        .stroke();

    let currentY = separatorY + 10;
    items.forEach((item) => {
        // Check that description and qty are defined
        doc
            .font('Helvetica')
            .fontSize(10)
            .text(item.description || 'N/A', 50, currentY)
            .text(item.qty ? item.qty.toString() : 'N/A', 450, currentY, { width: 100, align: 'right' });
        currentY += 20;
    });

    return currentY + 10;
}

// Function to add a group of items with a description and separator
function addGroupOfFItems(doc, startY, groupName, items) {
    doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(groupName, 50, startY);

    const separatorY = startY + 15;
    doc
        .moveTo(50, separatorY)
        .lineTo(550, separatorY)
        .stroke();

    let currentY = separatorY + 10;

    // Column Headers for Product, Packing, Unit, Qty, Weight
    const col1X = 50, col2X = 150, col3X = 250, col4X = 350, col5X = 450;
    doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .text('Product', col1X, currentY)
        .text('Packing', col2X, currentY)
        .text('Unit', col3X, currentY)
        .text('Qty', col4X, currentY, { width: 80, align: 'right' })
        .text('Weight', col5X, currentY, { width: 80, align: 'right' });
    
    currentY += 20;  // Move down to add item rows

    // Add items data below headers, spacing columns evenly
    items.forEach((item) => {
        doc
            .font('Helvetica')
            .fontSize(10)
            .text(item.product || 'N/A', col1X, currentY)
            .text(item.packing || 'N/A', col2X, currentY)
            .text(item.unit || 'N/A', col3X, currentY)
            .text(item.qty ? item.qty.toString() : 'N/A', col4X, currentY, { width: 80, align: 'right' })
            .text(item.weight ? item.weight.toString() : 'N/A', col5X, currentY, { width: 80, align: 'right' });
        currentY += 20; // Move down for next row
    });

    return currentY + 10;  // Add some space after the last item
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
    const additionalDetails = orderDetails ? await getAdditionalLoadingDetails(order_no) : [];

    const {
        delivery,
        TARE_TIME,
        TARE_WEIGHT,
        GROSS_TIME,
        GROSS_WEIGHT,
        NET_WEIGHT,
        groups,
        operator
    } = data;

    const doc = new PDFDocument();
    doc.pipe(res);

    const qrCodeData = await QRCode.toDataURL(order_no);

    doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .text('MY CURRENT COMPANY LTD', { align: 'center' })
        .fontSize(10)
        .text('MOMBASA', { align: 'center' })
        .text('Gate Pass Ticket', { align: 'center' })
        .text('----------------------------', { align: 'center' });

    if (orderDetails) {
        doc.text(`Ticket number: ${orderDetails.ticket_number || 'N/A'}`, { align: 'right' });
    } else {
        doc.text(`Ticket number: N/A`, { align: 'right' });
    }

    let currentY = 120;

    // Add item groups (if any)
    groups.forEach((group) => {
        currentY = addGroupOfItems(doc, currentY, group.name, group.items);
    });

    // Add loading group items with headers
    if (additionalDetails.length > 0) {
        const loadingGroupItems = additionalDetails.map(item => ({
            product: item.product,
            packing: item.packing,
            unit: item.unit,
            qty: item.qty,
            weight: item.weight
        }));
        currentY = addGroupOfFItems(doc, currentY, "Loading Group", loadingGroupItems);
    }

    // Add delivery info
    doc.font('Helvetica-Bold').fontSize(12).text(delivery, 50, currentY);

    const separatorY = currentY + 15;
    doc.moveTo(50, separatorY).lineTo(550, separatorY).stroke();

    currentY += 20;

    // Weight and other details
    const col1X = 50, col2X = 300, col3X = 350;

    doc
        .font('Helvetica')
        .fontSize(10)
        .text('1st WEIGHT', col1X, currentY)
        .text(TARE_WEIGHT || 'N/A', col2X, currentY)
        .text(TARE_TIME || 'N/A', col3X + 80, currentY, { align: 'right' });

    currentY += 20;

    doc
        .text('2nd WEIGHT', col1X, currentY)
        .text(GROSS_WEIGHT || 'N/A', col2X, currentY)
        .text(GROSS_TIME || 'N/A', col3X + 80, currentY, { align: 'right' });

    currentY += 20;

    doc
        .text('NET WEIGHT', col1X, currentY)
        .text(NET_WEIGHT || 'N/A', col2X, currentY)
        .text(GROSS_TIME || 'N/A', col3X + 80, currentY, { align: 'right' });

    currentY += 20;

    doc.moveTo(50, currentY).lineTo(550, currentY).stroke();

    currentY += 10;

    doc
        .font('Helvetica')
        .fontSize(10)
        .text('DRIVER SIGNATURE ', 50, currentY + 15);

    currentY += 50;

    const qrCodeWidth = 120, qrCodeHeight = 120, pageWidth = 595.28;
    const qrCodeX = (pageWidth - qrCodeWidth) / 2;

    doc
        .font('Helvetica')
        .text('Scan the QR Code for Details:', qrCodeX, currentY);

    doc
        .image(qrCodeData, qrCodeX, currentY + 15, { width: qrCodeWidth, height: qrCodeHeight });

    currentY += qrCodeHeight + 25;

    doc
        .font('Helvetica')
        .fontSize(8)
        .text('Printed at my company', 50, currentY, { align: 'center' });

    doc.end();
}

// Function to retrieve all processed delivery orders with mandatory search functionality
const getprocesseddeliveryorders = async (search) => {
    try {
        if (!search || String(search).trim() === "") {
            throw new Error("Search parameter is required and cannot be empty.");
        }

        const query = `
            SELECT 
                cust.name AS customer,
                prodty.name AS producttype,
                packty.name AS packingtype,
                ord.truck_no,
                ord.trailler_no,
                act1.tare_weight,
                act1.created_at AS tare_time,
                act2.gross_weight,
                act2.created_at AS gross_time,
                act2.qty AS net_weight,
                act2.created_at AS net_time,
                ord.order_number
            FROM tos_delivery_orders ord
            LEFT JOIN tos_drivers driv ON driv.id = ord.driver_id
            LEFT JOIN tos_customer cust ON cust.id = ord.customer_id
            LEFT JOIN tos_product_type prodty ON prodty.id = ord.product_type_id
            LEFT JOIN tos_packing_type packty ON packty.id = ord.packing_type_id
            LEFT JOIN tos_activities act1 ON act1.delivery_order_id = ord.id AND act1.activity_type = 10
            LEFT JOIN tos_activities act2 ON act2.delivery_order_id = ord.id AND act2.activity_type = 20
            WHERE ord.order_number LIKE $1;
        `;
        const { rows } = await pool.query(query, [`%${search}%`]);

        return rows;
    } catch (err) {
        console.error("Error fetching processed delivery orders:", err);
        throw new Error("Error fetching processed delivery orders");
    }
};

module.exports = {
    generatePDF,
    getprocesseddeliveryorders
};
