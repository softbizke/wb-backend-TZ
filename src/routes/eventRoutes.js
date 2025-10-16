// src/routes/eventRoutes.js
const express = require("express");
const axios = require("axios");
const cron = require("node-cron");
const router = express.Router();
const authenticateToken = require("../middlewares/auth");

// DEFINITION FOR REQURES
const anprEvents = require("../controllers/anpractivityController");
const users = require("../controllers/usersController");
const products = require("../controllers/productsController");
const packing = require("../controllers/packingController");
const customer = require("../controllers/customersController");
const driver = require("../controllers/driversController");
const activities = require("../controllers/activitiesController");
const deliveryorder = require("../controllers/deliveryorderController");
const vessel = require("../controllers/vesselController");
const dahau = require("../controllers/dahuaController");
const weight = require("../controllers/productWeightLimits.controller");
const tcpController = require("../controllers/tcpController");
const tcpController1 = require("../controllers/tcpController1");
const tcpController2 = require("../controllers/tcpController2");
const tcpController3 = require("../controllers/tcpController3");
const {
  startTcpServer,
  stopTcpServer,
  getParsedData,
} = require("../controllers/logicControler");

const pdfz = require("../controllers/pdfController");
const {
  requestManualMode,
  approveManualMode,
  rejectManualMode,
} = require("../controllers/manualModeController");


const { 
  fetchOrderTypeSummary, 
  fetchProductsSummary, 
  fetchDevicesStatus
} = require("../controllers/summaryStatsController");


// API ENDPOINTS
router.post("/anprEvents/v1", anprEvents.postnprActivitylog);
// CHheck Create and update the status of a user type
router.post(
  "/createuserstype/v1",
  authenticateToken.authenticateToken,
  users.createUserTypeController
);
router.get(
  "/userstype/list/v1",
  authenticateToken.authenticateToken,
  users.getAllUserTypes
);
// create a user in the systemXO
router.post(
  "/createusers/v1",
  authenticateToken.authenticateToken,
  users.createUser
);
// Update User by email
router.put(
  "/updateusers/v1",
  authenticateToken.authenticateToken,
  users.updateUser
);
// CHheck if username and password are valid
router.post("/validateuser/v1", users.checkUserCredentials);
// Send verification code to user
router.post(
  "/sendverificationcode/v1",
  users.sendVerificationCode
);
// Verify the code sent to user
router.post(
  "/verifycode/v1",
  users.verifyCode
);
//reset user password
router.post(
  "/resetuserpassword/v1",
  users.resetUserPassword
);
//Api to get all users
router.get(
  "/users/list/v1",
  authenticateToken.authenticateToken,
  users.getAllUsers
);
//Api to get all users
router.get(
  "/currentuser/v1",
  authenticateToken.authenticateToken,
  users.getUser
);

// Create and update the status of a product type
router.post(
  "/createproducttype/v1",
  authenticateToken.authenticateToken,
  products.createOrUpdateProductType
);
router.get(
  "/producttype/list/v1",
  authenticateToken.authenticateToken,
  products.getAllProductsTypes
);
router.post(
  "/createproduct/v1",
  authenticateToken.authenticateToken,
  products.createOrUpdateProduct
);
router.get(
  "/product/list/v1",
  authenticateToken.authenticateToken,
  products.getAllProducts
);
router.put(
  "/producttype/:id/v1",
  authenticateToken.authenticateToken,
  products.updateProductType
);
router.post(
  "/createwheattype/v1",
  authenticateToken.authenticateToken,
  products.createOrUpdateWheatType
);
router.get(
  "/wheattypes/list/v1",
  authenticateToken.authenticateToken,
  products.getAllWheatTypes
);

// Create and update the status of a packing and packing type
router.post(
  "/createpackingtype/v1",
  authenticateToken.authenticateToken,
  packing.createOrUpdatePackingType
);
router.get(
  "/packingtype/list/v1",
  authenticateToken.authenticateToken,
  packing.getAllPackingTypes
);
router.post(
  "/createpacking/v1",
  authenticateToken.authenticateToken,
  packing.createOrUpdatePacking
);
router.get(
  "/packing/list/v1",
  authenticateToken.authenticateToken,
  packing.getAllPacking
);

// Create and update the status of a customer type and customer
router.post(
  "/createcustomertype/v1",
  authenticateToken.authenticateToken,
  customer.createOrUpdateCustomerType
);
router.get(
  "/customertype/list/v1",
  authenticateToken.authenticateToken,
  customer.getAllCustomerTypes
);
router.post(
  "/createcustomer/v1",
  authenticateToken.authenticateToken,
  customer.createOrUpdateCustomer
);
router.post(
  "/updatecustomer/v1",
  authenticateToken.authenticateToken,
  customer.updateCustomerById
);
router.get(
  "/customer/list/v1",
  authenticateToken.authenticateToken,
  customer.getAllCustomer
);
router.post(
  "/createorfindcustomer/v1",
  authenticateToken.authenticateToken,
  customer.getOrCreateCustomerByCode
);

// Create and update the status of a driver
router.post(
  "/createdriver/v1",
  authenticateToken.authenticateToken,
  driver.createOrUpdateDriver
);
router.get(
  "/driver/list/v1",
  authenticateToken.authenticateToken,
  driver.getAllDrivers
);
router.post(
  "/createorfinddriver/v1",
  authenticateToken.authenticateToken,
  driver.getOrCreateDriverByID
);

// Create and update the status of a vessls
router.post(
  "/createvessel/v1",
  authenticateToken.authenticateToken,
  vessel.createOrUpdateVessel
);
router.get(
  "/vessel/list/v1",
  authenticateToken.authenticateToken,
  vessel.getAllVessels
);

// Create and update the status of a activity types, activity points and activities
router.post(
  "/createcamera/v1",
  authenticateToken.authenticateToken,
  activities.createOrUpdateCamera
);
router.get(
  "/cameras/list/v1",
  authenticateToken.authenticateToken,
  activities.getAllCameras
);
router.post(
  "/createactivitytype/v1",
  authenticateToken.authenticateToken,
  activities.createOrUpdateActivityType
);
router.post(
  "/createactivitypoint/v1",
  authenticateToken.authenticateToken,
  activities.createOrUpdateActivityPoint
);
router.get(
  "/activitytype/list/v1",
  authenticateToken.authenticateToken,
  activities.getAllActivityTypes
);
router.get(
  "/activitypoints/list/v1",
  authenticateToken.authenticateToken,
  activities.getAllActivityPoint
);

// Create and update the status of delivery orders
router.post(
  "/createdeliveryorders/v1",
  authenticateToken.authenticateToken,
  deliveryorder.createDeliveryOrder
);
router.post(
  "/createfinisheddeliveryorders/v1",
  deliveryorder.createDeliveryAndFinishedOrder
);

router.post(
  "/updatedeliveryorders/v1",
  authenticateToken.authenticateToken,
  deliveryorder.updateDeliveryOrderController
);
router.post(
  "/createdeliveryactivities/v1",
  authenticateToken.authenticateToken,
  activities.createOrUpdateActivity
);

router.put(
  "/approveactivity/v1",
  authenticateToken.authenticateToken,
  activities.approveActivity
);
router.get(
  "/deliveryorders/list/v1",
  authenticateToken.authenticateToken,
  deliveryorder.getAllDeliveryorders
);
router.get("/getdeliveryactivities/list/v1", activities.getAllActivities);
router.get(
  "/getdeliveryactivity/v1",
  authenticateToken.authenticateToken,
  activities.getActivity
);
router.get("/getwbactivity/list/v1", activities.getTruckActivities);
router.post(
  "/updatePlateNumber/v1",
  authenticateToken.authenticateToken,
  activities.updatePlateNumber
);
router.post("/getanprsnapshots/list/v1", dahau.getANPRSnapshots);
router.post(
  "/processDeliveryActivity/v1",
  authenticateToken.authenticateToken,
  activities.processWeighbridgeActivity
);
router.get(
  "/truck/images/v1",
  authenticateToken.authenticateToken,
  activities.getTruckImages
);

router.get(
  "/deliveryorders/print/v1",
  authenticateToken.authenticateToken,
  pdfz.generateReceiptHandler
);
router.post(
  "/createweightlimits/v1",
  authenticateToken.authenticateToken,
  weight.createOrUpdateProductWeightLimits
);

router.get(
  "/weight/list/v1",
  authenticateToken.authenticateToken,
  weight.getAllProductWeightLimits
);
//delete weight limit
router.delete(
  "/deleteweightlimits/v1/:id",
  authenticateToken.authenticateToken,
  weight.deleteProductWeightLimit
);
// createWeightLimitsBulk
router.post("/weights/bulk/v1", weight.createWeightLimitsBulk);
router.get("/weights/by-name/v1", weight.getProductWeightLimit);



//Summary stats routes
router.get(
  "/summary/order-type/v1",
  authenticateToken.authenticateToken,
  fetchOrderTypeSummary
);
router.get(
  "/summary/products/v1",
  authenticateToken.authenticateToken,
  fetchProductsSummary
); 

router.get(
  "/devices/status/v1",
  authenticateToken.authenticateToken,
  fetchDevicesStatus
);

module.exports = router;
