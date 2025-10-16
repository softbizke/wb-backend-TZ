// src/controllers/eventController.js
const axios = require("axios");
const plateService = require("../services/plateService");
const eventService = require("../services/anpractivityservice");
const eventBus = require("../lib/event_bus");
const weightReadingService = require("../socket_services/WeightReadingService");
const getCamerasActivityPoint =
  require("../services/activitiesService").getCamerasActivityPoint;

const postnprActivitylog = async (req, res) => {
  // Check if the body is in JSON format or nested format
  console.log("Camera Type", req.query.camera_type);
  const cameraType = req.query.camera_type || 1;
  let reg_no, camera_id, snap_time;
  let is_unlicensed = false;
  if (req.body.reg_no && req.body.camera_id && req.body.snap_time) {
    // Direct JSON format
    ({ reg_no, camera_id, snap_time } = req.body);
  } else {
    // Nested format
    const data = req.body;
    vehicleInfo = data?.Picture?.Vehicle;
    reg_no = data.Picture?.Plate?.PlateNumber;
    console.log("REG NO", reg_no);
    camera_id = data.Picture?.SnapInfo?.DeviceID;
    console.log("CAMERA ID", camera_id);
    snap_time = data.Picture?.SnapInfo?.AccurateTime;
  }
  // Check if vehicle is present but plate is missing
  eventBus.once("anpr:takeSnapshot", async (snapData) => {
    try {
      const data = req.body;
      vehicleInfo = data?.Picture?.Vehicle;
      const bbox = vehicleInfo?.VehicleBoundingBox;
      const vehiclePresent = bbox.some((v) => v > 0);
      if (!reg_no && vehiclePresent) {
        console.log("PLATE NULL", data.Picture?.Plate?.PlateNumber);
        const timestamp = Date.now();
        reg_no = `DUMMY_${timestamp}`;
        is_unlicensed = true;
        console.log("Dummy vehicle detected, assigned plate:", reg_no);
      }
    } catch (err) {
      partiallyValid = false;
    }
  });

  // Validate required fields and return error if any are missing
  if (!reg_no) {
    console.log("Plate number is required");
    return res
      .status(400)
      .json({ Success: "False", Error: "Plate number is required" });
  }
  if (!camera_id) {
    console.log("Camera ID is required");
    return res
      .status(400)
      .json({ Success: "False", Error: "Activity point is required" });
  }
  if (!snap_time) {
    console.log("Snap time is required");
    return res
      .status(400)
      .json({ Success: "False", Error: "Snap time is required" });
  }

  let anprActivityId1,
    anprActivityLogId2 = null;

  try {
    // Log the ANPRactivity with provided details
    const anprResult1 = await eventService.postanprActivities(
      reg_no,
      camera_id,
      snap_time,
      is_unlicensed,
      cameraType
    );

    console.log("anprResult1", `${anprResult1.id}, ${anprResult1.success}`);
    anprActivityId1 = anprResult1.id || null;
  } catch (err) {
    // Log any database errors and return a server error response
    console.error("Database error", err);
  }

  // Normalize the truck number input by removing spaces and converting to uppercase
  const truck = reg_no.replace(/\s+/g, "").toUpperCase();

  // Validate plate number using the plate service
  const plateValidationResult = plateService.identifyNumberPlate(truck);
  console.log("PLATE VALID ", plateValidationResult);
  //console.log(plateValidationResult);
  let partiallyValid = plateService.verifyNumberPlate(plateValidationResult);

  // Always save the record, using the formatted plate if possible, otherwise the original
  let plateToSave;
  if (
    plateValidationResult.status === "True" &&
    partiallyValid !== false &&
    plateValidationResult.normalized
  ) {
    plateToSave = plateValidationResult.normalized;
  } else {
    plateToSave = reg_no; // fallback to original
  }

  try {
    console.log(
      "POSTING ANPR ACTIVITY LOG, plate:",
      plateToSave,
      "camera_id:",
      camera_id,
      "snap_time:",
      snap_time,
      "is_unlicensed:",
      is_unlicensed
    );
    const anprResult2 = await eventService.postanprActivitylog(
      plateToSave,
      camera_id,
      snap_time,
      is_unlicensed,
      cameraType
    );

    console.log("anprResult2", `${anprResult2.id}, ${anprResult2.success}`);
    anprActivityLogId2 = anprResult2.id || null;

    if (anprActivityId1 && anprActivityLogId2) {
      //We get the weight

      const wbList = await getCamerasActivityPoint(cameraType);
      let hasWeight = false;
      if (wbList.length > 0) {
        console.log("Weight socket initializing");
        const wbData = wbList[0];

        weightReadingService.registerCallbacks({
          onWeightUpdate: async (weight) => {

            console.log("Weight update received:", weight);

            // weightReadingService.stopWeightReading(wbData.address); // this affectes frontend
            // lets close socket directly

            weightReadingService.socket.close();
            weightReadingService.socket = null;


            //update weight for tos_anpr and tos_anpr_table
            if(!hasWeight) {
              const updateAnprActivityLogMsg =
                await eventService.updateanprActivities(anprActivityId1, weight);
              const updateAnprActivityMsg =
                await eventService.updateanprActivitylog(
                  anprActivityLogId2,
                  weight
                );

              if (
                updateAnprActivityLogMsg.success &&
                updateAnprActivityMsg.success
              ) {
                console.log("data updated successfully");
              }
            }
            hasWeight = true;



          },
          onError: (message) => {
            console.log("Weight reading error:", message);
          },
          onConnectionChange: (connected) => {
            if (connected) {
              console.log("Socket connected successfully");
            }
            console.log("Socket not connected");
          },
        });
        // const initResponse = await weightReadingService.initTcpClient(
        //   wbData.address
        // );

        // console.log("initResponse", initResponse);
        // if (initResponse.success) {
        //   await weightReadingService.startWeightReading(wbData);
        // }
      }
    }

    return res
      .status(200)
      .json({ Success: plateValidationResult.status, Error: "" });
  } catch (err) {
    // Log any database errors and return a server error response
    console.error("Database error", err);
    if (!res.headersSent) {
      return res.status(500).json({
        Success: plateValidationResult.status,
        Error: "Error While posting",
      });
    }
  }
};

module.exports = {
  postnprActivitylog,
};
