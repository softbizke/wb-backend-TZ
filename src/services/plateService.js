const { Pool } = require("pg");
const { dbConfig } = require("../config/dbConfig");
const { AxiosDigestAuth } = require("@lukesthl/ts-axios-digest-auth");
const fs = require("fs").promises;
const path = require("path");
const os = require("os");

const cameras = [
  {
    id: 1,
    url: "http://30.30.30.109/cgi-bin/snapshot.cgi?channel=1&type=0",
    username: "admin",
    password: "admin@1234",
  },
  {
    id: 2,
    url: "http://30.30.30.110/cgi-bin/snapshot.cgi?channel=1&type=0", // Update with second camera IP
    username: "admin",
    password: "admin@1234",
  },
];

const pool = new Pool({
  user: dbConfig.user,
  host: dbConfig.host,
  database: dbConfig.database,
  password: dbConfig.password,
  port: dbConfig.port,
});

const patterns = {
  Kenya: /^[Kk][A-Za-z]{2}\d{3}[A-Za-z]?$/,
  Uganda: /^[Uu][A-Za-z]{2}\s?\d{3}[A-Za-z]$/,
  Tanzania: /^[Tt]\s?\d{3}\s?[A-Za-z]{3}$/,
  Rwanda: /^[Rr][A-Za-z]{2}\s?\d{3}[A-Za-z]$/,
  Burundi: /^[Dd]\s?\d{4}\s?[A-Za-z]$/,
  SouthSudan: /^[Ss][Ss][Dd]\s?\d{3}[A-Za-z]$/,
};

const verifyPatterns = [
  /^[Kk][A-Za-z]{2}\d{1,3}[A-Za-z0-9]?$/,
  /^[Uu][A-Za-z]{2}\s?\d{2,3}[A-Za-z0-9]$/,
  /^[Tt]\s?\d{3}\s?[A-Za-z]{3}$/,
  /^[Rr][A-Za-z]{2}\s?\d{2,3}[A-Za-z0-9]$/,
  /^[Dd]\s?\d{4}\s?[A-Za-z]$/,
  /^[Ss][Ss][Dd]\s?\d{2,3}[A-Za-z0-9]$/,
];

//normalize Kenyan  plate
function normalizeKenyaPlate(input) {
  let secondLetter = input[1];
  let thirdLetter = input[2];

  if (secondLetter === "O") secondLetter = "D";
  if (thirdLetter === "I") thirdLetter = "L";
  else if (thirdLetter === "O") thirdLetter = "Q";

  const likelyNumberMap = {
    A: "4",
    B: "8",
    E: "3",
    G: "6",
    S: "5",
    T: "7",
    Z: "2",
    O: "0",
    Q: "9",
  };

  let numbers = input
    .slice(3, 6)
    .split("")
    .map((c) => likelyNumberMap[c] || c)
    .join("");
  const optionalLastLetter = input.length > 6 ? input[6] : "";

  return `K${secondLetter}${thirdLetter}${numbers}${optionalLastLetter}`;
}

function identifyNumberPlate(input) {
  const originalInput = input;

  input = input.replace(/\s+/g, "").toUpperCase();
  if (input.length > 7 && !/^T/.test(input)) {
    input = input.slice(0, 7); // trim noisy input unless Tanzanian
  }

  let isKenyaCandidate = /^K[A-Z]{2}\d{3}[A-Z0-9]?$/.test(input);

  if (isKenyaCandidate) {
    input = normalizeKenyaPlate(input);
  }

  for (const country in patterns) {
    if (patterns[country].test(input)) {
      return {
        status: "True",
        normalized: input,
        original: originalInput,
        country,
      };
    }
  }
  return {
    status: "False",
    normalized: input,
    original: originalInput,
    country: null,
  };
}

function verifyNumberPlate(data) {
  if (!data) {
    return;
  }
  if (data.status === "True") return true;

  const inputNormalized = data.normalized;

  return verifyPatterns.some((pat) => pat.test(inputNormalized));
}

async function takeSnapshot(cameraIPs) {
  const username = "admin";
  const password = "admin@1234";

  const DigestFetch = (await import("digest-fetch")).default;
  const client = new DigestFetch(username, password);

  const snapshots = [];

  for (const ip of cameraIPs) {
    const snapshotUrl = `http://${ip}/cgi-bin/trafficSnap.cgi?action=manSnap&channel=1`;

    try {
      const response = await client.fetch(snapshotUrl, { method: "GET" });
      const responseBody = await response.text();
      console.log(`Camera IP: ${ip}`);
      console.log("Response Status:", response.status);
      console.log("Response Body:", responseBody);

      if (response.ok) {
        snapshots.push({ ip, success: true, snapshot: responseBody.trim() });
      } else {
        snapshots.push({
          ip,
          success: false,
          error: `Snapshot failed: ${response.statusText}`,
        });
      }
    } catch (error) {
      console.error(`Error taking snapshot from camera ${ip}:`, error.message);
      snapshots.push({
        ip,
        success: false,
        error: "Snapshot operation failed",
      });
    }
  }

  return snapshots;
}

async function takeANPRSnapShot(weighbridgeData) {
  const camera = {
    id: weighbridgeData.camera_id,
    url: `http://${weighbridgeData.camera_ip}/cgi-bin/snapshot.cgi?channel=1&type=0`,
    username: weighbridgeData.camera_username || "admin",
    password: weighbridgeData.camera_password || "admin@1234",
  };

  console.log("Camera url", camera.url);

  const digestAuthClient = new AxiosDigestAuth({
    username: camera.username,
    password: camera.password,
  });
  // 1. Take snapshot
  const snapshot = await getSnapshotFromCamera(camera, digestAuthClient);
  // 2. Fetch latest ANPR plate info
  // const anprUrl = `http://${camera.ip}/cgi-bin/vehicle.cgi?action=getLastVehicleInfo`;

  // let plateData = null;

  // try {
  //     const anprResponse = await digestAuthClient.request({
  //         method: 'GET',
  //         url: anprUrl
  //     });
  //     console.log('VEH PLATE DATA', anprResponse);
  //     plateData = anprResponse.data;
  // } catch (error) {
  //     console.error('Failed to get ANPR data:', error.message);
  // }
  // return { snapshot: [snapshot], plateData };
  return [snapshot];
}

async function getSnapshotFromCamera(camera, authClient) {
  try {
    const response = await authClient.request({
      method: "GET",
      url: camera.url,
      responseType: "arraybuffer",
    });
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    const snapshotDir = path.join(__dirname, "../../public/snapshots");
    const filename = `camera${camera.id}_snapshot_${timestamp}.jpg`;
    const filepath = path.join(snapshotDir, filename);

    await fs.mkdir(snapshotDir, { recursive: true });

    await fs.writeFile(filepath, response.data);
    return filename;
  } catch (error) {
    console.log(
      `Error handling snapshot from Camera ${camera.id}:`,
      error.message
    );
    throw error;
  }
}

module.exports = {
  identifyNumberPlate,
  takeSnapshot,
  takeANPRSnapShot,
  verifyNumberPlate,
};
