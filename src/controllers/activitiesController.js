const eventBus = require("../lib/event_bus");
const activities = require("../services/activitiesService");
const plates = require("../services/plateService");
const { autoPrintReceipt } = require("./pdfController");

// Function to create activity types
const createOrUpdateActivityType = async (req, res) => {
  const { name, type, isactive } = req.body;

  // Validate the input fields
  if (!name || !type || typeof isactive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "name, type, and isactive status are required",
    });
  }

  try {
    // Call the service function to either create or update the activity type
    const result = await activities.createOrUpdateActivityType(
      name,
      type,
      isactive
    );

    // Return response based on the result
    if (result.success) {
      return res.status(200).json({ success: true, message: result.message });
    } else {
      return res.status(409).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("Error in controller:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAllCameras = async (req, res) => {
  try {
    const cameras = await activities.getAllCameras();
    res.status(200).json({
      success: true,
      data: cameras,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve cameras",
    });
  }
};

const createOrUpdateCamera = async (req, res) => {
  const {
    model,
    ip_address,
    rtsp_url,
    status,
    configuration,
    username,
    password,
  } = req.body;

  if (!model || !ip_address || !rtsp_url) {
    return res.status(400).json({
      success: false,
      message: "Model, IP address and RTSP URL are required",
    });
  }

  try {
    const result = await activities.createOrUpdateCamera({
      model,
      ip_address,
      rtsp_url,
      status: status || "active",
      configuration: configuration || { resolution: "1920x1080", fps: 30 },
      username,
      password,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in controller:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const createOrUpdateActivityPoint = async (req, res) => {
  console.log("Received request to create or update activity point:", req.body);
  const { name, address, isactive, camera_ids } = req.body;

  if (!name || !address || typeof isactive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "name, address, and isactive status are required",
    });
  }

  try {
    const result = await activities.createOrUpdateActivityPoint(
      name,
      address,
      isactive,
      camera_ids
    );

    if (result.success) {
      return res.status(200).json({ success: true, message: result.message });
    } else {
      return res.status(409).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("Error in controller:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const updatePlateNumber = async (req, res) => {
  const { newPlateNumber, oldPlateNumber } = req.body;
  console.log("UPDATE PLATE NUMBER", req.body);

  if (!oldPlateNumber || !newPlateNumber) {
    return res.status(400).json({
      success: false,
      message: "Old and New plate numbers are required",
    });
  }

  try {
    await activities.updatePlateNumberV2(req.body);
    return res.status(200).json({
      success: true,
      message: "Plate number updated successfully",
    });
  } catch (error) {
    console.error("Error updating plate number:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update plate number",
    });
  }
};

const createOrUpdateActivity = async (req, res) => {
  console.log("Received request to create or update activity:", req.body);
  let { truck_no, weighbridge_id, old_truck_no } = req.body;
  try {
    // await new Promise((resolve) => setTimeout(resolve, 2000));

    // capture truck on wb

    const activitiesperfomed = await activities.getTruckOnWb(
      truck_no,
      weighbridge_id
    );

    console.log("Activities performed:", activitiesperfomed);
    console.log("Old Truck No:", old_truck_no);

    if (!activitiesperfomed && !old_truck_no) {
      return res.status(400).json({
        success: false,
        message: `Truck ${truck_no} not on Weighbridge`,
      });
    }

    const result = await activities.createOrUpdateActivityV2(
      req.body,
      req.user
    );

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error in createOrUpdateActivity:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Controller to get all activity types
const getAllActivityTypes = async (req, res) => {
  try {
    // Extract the search query from request parameters
    const { name, id_no } = req.query;
    console.log(id_no, name);

    // Call the service function with the search query
    const customerTypes = await activities.getAllActivityTypes(name);

    // Send the response with the filtered customer types
    res.status(200).json({
      success: true,
      data: customerTypes,
    });
  } catch (error) {
    console.error("Error in getAllCAllactivittyType:", error);

    // Send error response
    res.status(500).json({
      success: false,
      message: "Failed to retrieve Activity types",
    });
  }
};

// Controller to get all activity types
const getAllActivityPoint = async (req, res) => {
  try {
    // Extract the search query from request parameters
    const { name, id_no } = req.query;
    console.log(id_no, name);

    // Call the service function with the search query
    const customerTypes = await activities.getAllActivityPoint(name);

    // Send the response with the filtered customer types
    res.status(200).json({
      success: true,
      data: customerTypes,
    });
  } catch (error) {
    console.error("Error in getAllCAllactivittyType:", error);

    // Send error response
    res.status(500).json({
      success: false,
      message: "Failed to retrieve Activity types",
    });
  }
};

const getAllActivities = async (req, res) => {
  try {
    const { truck, order_no } = req.query;
    console.log(truck, order_no);

    const activitiesperfomed = await activities.getAllActivitiesV2(
      truck,
      order_no
    );

    res.status(200).json({
      success: true,
      data: activitiesperfomed,
    });
  } catch (error) {
    console.error("Error in getAllActivities:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve Activity types",
    });
  }
};

//get activity
const getActivity = async (req, res) => {
  try {
    //id has been set to params in axios get request
    const { id } = req.query;
    console.log("getActivity id", id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Activity ID is required",
      });
    }

    const activity = await activities.getActivity(id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    res.status(200).json({
      success: true,
      data: activity[0],
    });
  } catch (error) {
    console.error("Error in getActivity:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve activity",
    });
  }
};

const getTruckActivities = async (req, res) => {
  try {
    const { search, weighbridge_id, editing } = req.query;
    const weighbridgeData = await activities.getWeighbridgePoint(
      weighbridge_id
    );

    const activitiesperfomed = await activities.getTruckActivities(
      search,
      weighbridge_id,
      editing
    );

    console.log("Activities performed:", activitiesperfomed);

    if (activitiesperfomed.length > 0) {
      const firstTwo = activitiesperfomed.slice(0, 2);
      return res.status(200).json({
        success: true,
        data: activitiesperfomed,
        truck_details: firstTwo.map((activity) => ({
          truck_no: activity.truck_no,
          last_activity_time: activity.created_time,
          is_unlicensed: activity?.is_unlicensed ?? false,
          weighbridge_name: weighbridgeData ? weighbridgeData.name : null,
        })),
      });
    }

    return res.status(200).json({
      success: false,
      data: activitiesperfomed,
      message: `No truck activity found`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve truck activities",
    });
  }
};

const processWeighbridgeActivity = async (req, res) => {
  try {
    const { weighbridge_id } = req.body;

    console.log("weighbridge_id", weighbridge_id);

    const weighbridgeData = await activities.getWeighbridgePoint(
      weighbridge_id
    );
    const allSnapshots = [];
    const cameraIPs = [];
    console.log("Weighbridge Data:", weighbridgeData); 

    for (const camera_id of weighbridgeData.camera_ids) {
      const cameraIndex = weighbridgeData.camera_ids.indexOf(camera_id);
      const cameraData = {
        camera_id: camera_id,
        camera_ip: weighbridgeData.camera_ips[cameraIndex],
        camera_username: weighbridgeData.camera_usernames[cameraIndex],
        camera_password: weighbridgeData.camera_passwords[cameraIndex],
        camera_name: weighbridgeData.camera_models
          ? weighbridgeData.camera_models[cameraIndex]
          : `Camera ${cameraIndex + 1}`,
      };

      console.log("CameraData", cameraData);

      const snapshots = await plates.takeANPRSnapShot(cameraData);
      //fire event to ANPR module to bypass checks
      // eventBus.emit("anpr:snapshotTaken", camera_id);

      const snapshotsWithCameraInfo = snapshots.map((snapshot, index) => ({
        filename: snapshot,
        camera_id: camera_id,
        camera_name: cameraData.camera_name,
        snapshot_number: index + 1,
      }));
      console.log("Snapshots with camera info:", snapshotsWithCameraInfo);

      allSnapshots.push(...snapshotsWithCameraInfo);
    }

    eventBus.emit("anpr:takeSnapshot", {
      ids: weighbridgeData.camera_ids,
    });

    await new Promise((resolve) => setTimeout(resolve, 3000));

    const truckActivities = await activities.getTruckActivities(
      null,
      weighbridge_id
    );
    const latestTruck =
      truckActivities.length > 0 ? truckActivities[0].truck_no : null;
    if (allSnapshots.length === 0) {
      throw new Error("No snapshots taken");
    }

    // if (!latestTruck) {
    //   throw new Error("Could not detect any truck at the weighbridge");
    // }

    res.json({
      success: true,
      allSnapshots: allSnapshots,
      truck_no: latestTruck,
      message: "Weighbridge activity processed successfully",
    });
  } catch (error) {
    res.status(200).json({
      success: false,
      message: error.message,
    });
  }
};

const getTruckImages = async (req, res) => {
  try {
    const { truck_no } = req.query;
    const images = await activities.getTruckImages(truck_no);
    res.status(200).json({
      success: true,
      data: images,
    });
  } catch (error) {
    console.error("Error in getTruckImages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve truck images",
    });
  }
};

const approveActivity = async (req, res) => {
  try {
    const { id, reason } = req.body;
    const result = await activities.approveActivity({
      id,
      reason,
      user: req.user,
    });
    res.status(200).json(result);
  } catch (error) {
    console.error("Error Approving Activity:", error);
    res.status(500).json({
      success: false,
      message: error.message ?? "Failed to retrieve truck images",
    });
  }
};

module.exports = {
  createOrUpdateActivityType,
  createOrUpdateActivityPoint,
  createOrUpdateActivity,
  createOrUpdateCamera,
  updatePlateNumber,
  getAllActivityTypes,
  getAllActivityPoint,
  getAllActivities,
  getTruckActivities,
  getAllCameras,
  processWeighbridgeActivity,
  getTruckImages,
  getActivity,
  approveActivity,
};
