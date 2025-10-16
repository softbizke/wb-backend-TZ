const { Pool } = require('pg');
const { dbConfig } = require('../config/dbConfig');

// Create a connection pool
const pool = new Pool({
    user: dbConfig.user,
    host: dbConfig.host,
    database: dbConfig.database,
    password: dbConfig.password,
    port: dbConfig.port,
});

// Regular expression patterns for East African number plates
const patterns = {
    Kenya: /^[Kk][A-Za-z]{2}\s?\d{3}[A-Za-z]$/,
    Uganda: /^[Uu][A-Za-z]{2}\s?\d{3}[A-Za-z]$/,
    Tanzania: /^[Tt]\s?\d{3}\s?[A-Za-z]{3}$/,
    Rwanda: /^[Rr][A-Za-z]{2}\s?\d{3}[A-Za-z]$/,
    Burundi: /^[Dd]\s?\d{4}\s?[A-Za-z]$/,
    SouthSudan: /^[Ss][Ss][Dd]\s?\d{3}[A-Za-z]$/
};

// Function to identify the country of a number plate
function identifyNumberPlate(input) {
    // Remove spaces and ensure the input is uppercase
    input = input.replace(/\s+/g, '').toUpperCase();

    // Apply alterations for Kenyan plates
    if (/^[Kk][A-Za-z]{2}\d{3}[A-Za-z]$/.test(input)) {
        let secondLetter = input[1];
        let thirdLetter = input[2];

        // Replace the second letter if it is 'O'
        if (secondLetter === 'O') {
            secondLetter = 'D';
        }

        // Replace the third letter if it is 'I' or 'O'
        if (thirdLetter === 'I') {
            thirdLetter = 'L';
        } else if (thirdLetter === 'O') {
            thirdLetter = 'Q';
        }

        // Reconstruct the input with the alterations
        input = `K${secondLetter}${thirdLetter}${input.slice(3)}`;
    }

    // Validate the altered input against the patterns
    for (const country in patterns) {
        if (patterns[country].test(input)) {
            return 'True'; // Match found
        }
    }
    return 'False'; // No match
}


// Function to retrieve the snapshot from the camera
async function takeSnapshot(cameraIPs) {
    const username = 'admin';
    const password = 'admin@1234';

    // Import digest-fetch for HTTP digest authentication
    const DigestFetch = (await import('digest-fetch')).default;
    const client = new DigestFetch(username, password);

    const snapshots = [];

    for (const ip of cameraIPs) {
        // Build the snapshot URL for the current camera IP
        const snapshotUrl = `http://${ip}/cgi-bin/trafficSnap.cgi?action=manSnap&channel=1`;

        try {
            const response = await client.fetch(snapshotUrl, { method: 'GET' });
            const responseBody = await response.text();
            console.log(`Camera IP: ${ip}`);
            console.log('Response Status:', response.status);
            console.log('Response Body:', responseBody);

            if (response.ok) {
                snapshots.push({ ip, success: true, snapshot: responseBody.trim() });
            } else {
                snapshots.push({ ip, success: false, error: `Snapshot failed: ${response.statusText}` });
            }
        } catch (error) {
            console.error(`Error taking snapshot from camera ${ip}:`, error.message);
            snapshots.push({ ip, success: false, error: 'Snapshot operation failed' });
        }
    }

    return snapshots;
}

module.exports = {
    identifyNumberPlate,
    takeSnapshot
};
