const supplierService = require("../services/supplierService");

// Create or update supplier
const createOrUpdateSupplier = async (req, res) => {
  const { name, phone_number, isactive } = req.body;

  if (!name || !phone_number || typeof isactive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "name, phone_number, and isactive status are required",
    });
  }

  try {
    const result = await supplierService.createOrUpdateSupplier(
      name,
      phone_number,
      isactive
    );

    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    console.error("Error in createOrUpdateSupplier:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all suppliers
const getAllSuppliers = async (req, res) => {
  try {
    const { search } = req.query;
    const result = await supplierService.getAllSuppliers(search);

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error in getAllSuppliers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve suppliers",
    });
  }
};

// Get or create supplier by phone
const getOrCreateSupplierByPhone = async (req, res) => {
  const { name, phone_number, isactive } = req.body;

  if (!phone_number) {
    return res.status(400).json({
      success: false,
      message: "phone_number is required",
    });
  }

  try {
    const id = await supplierService.getOrCreateSupplierByPhone(
      name,
      phone_number,
      isactive
    );
    res.status(200).json({ success: true, id });
  } catch (error) {
    console.error("Error in getOrCreateSupplierByPhone:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createOrUpdateSupplier,
  getAllSuppliers,
  getOrCreateSupplierByPhone,
};
