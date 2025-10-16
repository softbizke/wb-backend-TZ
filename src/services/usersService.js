const { Pool } = require("pg");
const { dbConfig } = require("../config/dbConfig");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { secretKey } = require("../config/configs");
const { default: axios } = require("axios");
//const authenticateToken = require('../middlewares/auth');
// Create a connection pool
const pool = new Pool({
  user: dbConfig.user,
  host: dbConfig.host,
  database: dbConfig.database,
  password: dbConfig.password,
  port: dbConfig.port,
});

//SERVICE TO CREATE OR UPDATE THE USER TYPES
const createOrUpdateUserType = async (name, isactive) => {
  try {
    // Ensure parameters are valid
    if (!name || typeof isactive !== "boolean") {
      return { success: false, message: "Invalid input parameters" };
    }

    // Check if the name already exists (case-insensitive)
    const checkNameQuery =
      "SELECT id, isactive FROM tos_user_type WHERE LOWER(name) = LOWER($1)";
    const nameResult = await pool.query(checkNameQuery, [name]);

    // If the user type already exists, check if the status needs to be updated
    if (nameResult.rows.length > 0) {
      const existingUserType = nameResult.rows[0];
      if (existingUserType.isactive !== isactive) {
        // If the current status is different from the passed status, update it
        const updateQuery = `
          UPDATE tos_user_type
          SET isactive = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `;
        await pool.query(updateQuery, [isactive, existingUserType.id]);

        return {
          success: true,
          message: `User type status updated to ${
            isactive ? "active" : "inactive"
          }`,
        };
      } else {
        return {
          success: false,
          message: `User type is already ${isactive ? "active" : "inactive"}`,
        };
      }
    } else {
      // If the user type does not exist, create a new one
      const insertQuery = `
        INSERT INTO tos_user_type (name, isactive, created_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        RETURNING id
      `;
      const insertResult = await pool.query(insertQuery, [name, isactive]);

      // Return success response with the created ID
      return {
        success: true,
        message: "User type created",
        id: insertResult.rows[0].id,
      };
    }
  } catch (error) {
    console.error("Error creating or updating user type:", error.message);
    throw new Error("Error creating or updating user type");
  }
};

// Service to create a user
const createUser = async (
  first_name,
  last_name,
  phone,
  password,
  id_no,
  user_type_id,
  isactive
) => {
  try {
    // Check if the phone already exists
    const checkEmailQuery = "SELECT phone FROM tos_users WHERE phone = $1";
    const emailResult = await pool.query(checkEmailQuery, [phone]);

    if (emailResult.rows.length > 0) {
      return { success: false, message: "Phone number already exists" };
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert the new user into the database
    const insertQuery = `
      INSERT INTO tos_users (first_name, last_name, phone, password, id_no, user_type_id, isactive, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    await pool.query(insertQuery, [
      first_name,
      last_name,
      phone,
      hashedPassword,
      id_no,
      user_type_id,
      isactive,
    ]);

    //send message to user to inform them of successful registration and they should now reset their password since the initial password is set by the administrator
    //we are not using await since we do not want to block the user creation process. Messages are not critical to the user creation process
    axios
      .post(
        "https://api.mobilesasa.com/v1/send/message",
        {
          phone: phone,
          message: `Hello ${first_name}, you have been successfully registered to WeighSoft system. Please reset your password to secure your account. \n Go to the WeighSoft system and select 'Forgot Password' to reset your password. If you have any questions, please contact support.`,
          senderID: "KFM DOLA",
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.MOBILE_SASA_API_KEY}`,
          },
        }
      )
      .then((response) => {
        console.log("SMS sent successfully:", response.data);
      })
      .catch((error) => {
        console.error("Error sending SMS:", error);
      });
    // Return success response
    return { success: true, message: "User created" };
  } catch (error) {
    console.error("Error creating user:", error.message);
    throw new Error("Server error");
  }
};

// Service to update a user
const updateUser = async (phone, first_name, last_name, password, isactive) => {
  try {
    // Check if the user exists
    const checkUserQuery = "SELECT * FROM tos_users WHERE phone = $1";
    const userResult = await pool.query(checkUserQuery, [phone]);

    if (userResult.rows.length === 0) {
      return { success: false, message: "User with this phone not found" };
    }

    const userId = userResult.rows[0].id; // Get the user ID from the result

    // Prepare update query
    let updateQuery = "UPDATE tos_users SET ";
    let values = [];
    let counter = 1;

    // Conditionally add fields to be updated
    if (first_name) {
      updateQuery += `first_name = $${counter}, `;
      values.push(first_name);
      counter++;
    }

    if (last_name) {
      updateQuery += `last_name = $${counter}, `;
      values.push(last_name);
      counter++;
    }

    if (password) {
      // Hash the new password if provided
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      updateQuery += `password = $${counter}, `;
      values.push(hashedPassword);
      counter++;
    }

    if (isactive !== undefined) {
      updateQuery += `isactive = $${counter}, `;
      values.push(isactive);
      counter++;
    }

    // Remove the trailing comma and space from the query
    updateQuery = updateQuery.slice(0, -2);

    // Add the WHERE condition to specify the user
    updateQuery += ` WHERE id = $${counter}`;
    values.push(userId);

    // Execute the update query
    await pool.query(updateQuery, values);

    return { success: true, message: "User updated successfully" };
  } catch (error) {
    console.error("Error updating user:", error.message);
    throw new Error("Server error");
  }
};

// Function to check user credentials
const checkUser = async (phone, password) => {
  try {
    const checkUserQuery = `
      SELECT id, password, isactive 
      FROM tos_users 
      WHERE phone = $1
    `;
    const userResult = await pool.query(checkUserQuery, [phone]);
    console.log("User Result:", userResult.rows);
    if (userResult.rows.length === 0) {
      return { success: false, message: "User not found" };
    }

    const user = userResult.rows[0]; // Get the user data

    // Check if the user is active
    if (!user.isactive) {
      return { success: false, message: "User account is inactive" };
    }

    // Compare the provided password with the hashed password stored in the database
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (isPasswordMatch) {
      // Create a token if the password matches
      const token = jwt.sign({ id: user.id }, secretKey, { expiresIn: "12h" });

      return { success: true, token };
    } else {
      return { success: false, message: "Incorrect password" };
    }
  } catch (error) {
    console.error("Error checking user credentials:", error);
    throw new Error("Server error");
  }
};

// Function to check user and send code to verify user on password reset
const sendVerificationCode = async (phone) => {
  try {
    // Check if the user exists
    const checkUserQuery = "SELECT id, phone FROM tos_users WHERE phone = $1";
    const userResult = await pool.query(checkUserQuery, [phone]);
    if (userResult.rows.length === 0) {
      return { success: false, message: "User not found" };
    }
    const phoneNo = userResult.rows[0].phone; // Get the user ID
    // Generate a verification code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    // Store the verification code in the database
    const insertCodeQuery = `
      INSERT INTO tos_phone_no_verification_code (phone_no, code, is_valid, created_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    `;
    await pool.query(insertCodeQuery, [phoneNo, verificationCode, true]);
    // Here you would typically send the verification code to the user's phone via SMS
    await axios.post(
      "https://api.mobilesasa.com/v1/send/message",
      {
        phone: phoneNo,
        message: `Your verification code is: ${verificationCode}`,
        senderID: "KFM DOLA",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MOBILE_SASA_API_KEY}`,
        },
      }
    );

    //This code invalidates the verification code if not used within 30 minutes
    setTimeout(async () => {
      const deactivateCodeQuery = `
        UPDATE tos_phone_no_verification_code 
        SET is_valid = false 
        WHERE phone_no = $1 AND code = $2
      `;
      await pool.query(deactivateCodeQuery, [phoneNo, verificationCode]);
    }, 30 * 60 * 1000); // 30 minutes in milliseconds

    return { success: true, message: "Verification code sent successfully" };
  } catch (error) {
    console.error("Error sending verification code:", error);
    throw new Error("Server error");
  }
};

const verifyCode = async (phone, code) => {
  try {
    // Check if the verification code exists and is valid
    const checkCodeQuery = `
      SELECT * FROM tos_phone_no_verification_code 
      WHERE phone_no = $1 AND code = $2 AND is_valid = true
    `;
    const codeResult = await pool.query(checkCodeQuery, [phone, code]);

    if (codeResult.rows.length === 0) {
      return {
        success: false,
        message: "Invalid or expired verification code",
      };
    }

    // If valid, mark the code as used
    const updateCodeQuery = `
      UPDATE tos_phone_no_verification_code 
      SET is_valid = false 
      WHERE phone_no = $1 AND code = $2
    `;
    await pool.query(updateCodeQuery, [phone, code]);

    return { success: true, message: "Verification successful" };
  } catch (error) {
    console.error("Error verifying code:", error);
    throw new Error("Server error");
  }
};

//Function to reset user password
const resetUserPassword = async (phone, newPassword) => {
  try {
    // Check if the user exists
    const checkUserQuery = "SELECT id FROM tos_users WHERE phone = $1";
    const userResult = await pool.query(checkUserQuery, [phone]);

    if (userResult.rows.length === 0) {
      return { success: false, message: "User not found" };
    }

    const userId = userResult.rows[0].id; // Get the user ID

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the user's password
    const updatePasswordQuery = `
      UPDATE tos_users 
      SET password = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
    `;
    await pool.query(updatePasswordQuery, [hashedPassword, userId]);

    return { success: true, message: "Password reset successfully" };
  } catch (error) {
    console.error("Error resetting user password:", error);
    throw new Error("Server error");
  }
};

// Function to retrieve all product with optional search functionality
const getAllUsers = async (search) => {
  try {
    // Base query to retrieve customer types
    let query = "SELECT * FROM tos_users";
    const queryParams = [];

    // Add a WHERE clause if search parameter is provided
    if (search) {
      query += " WHERE phone ILIKE $1";
      queryParams.push(`%${search}%`);
    }

    // Append ORDER BY clause
    query += " ORDER BY id ASC";

    // Execute the query with parameters
    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving customer types:", error);
    throw new Error("Server error");
  }
};

const getUser = async (ID) => {
  try {
    console.log(ID);
    // Base query to retrieve users
    let query =
      "SELECT id, first_name,last_name,email,user_type_id,isactive FROM tos_users";
    const queryParams = [];

    // Add a WHERE clause if ID parameter is provided
    if (ID) {
      query += " WHERE id = $1";
      queryParams.push(ID); // Use the ID as-is since it’s likely numeric
    }

    // Append ORDER BY clause
    query += " ORDER BY id ASC";

    //console.log(query);
    // Execute the query with parameters
    const result = await pool.query(query, queryParams);
    return result.rows[0];
  } catch (error) {
    console.error("Error retrieving users:", error);
    throw new Error("Server error");
  }
};

const getAllUserTypes = async (search) => {
  try {
    // Base query to retrieve customer types
    let query = "SELECT * FROM tos_user_type";
    const queryParams = [];

    // Add a WHERE clause if search parameter is provided
    if (search) {
      query += " WHERE name ILIKE $1";
      queryParams.push(`%${search}%`);
    }

    // Append ORDER BY clause
    query += " ORDER BY id ASC";

    // Execute the query with parameters
    const result = await pool.query(query, queryParams);
    return result.rows;
  } catch (error) {
    console.error("Error retrieving customer types:", error);
    throw new Error("Server error");
  }
};

module.exports = {
  createOrUpdateUserType,
  createUser,
  updateUser,
  checkUser,
  sendVerificationCode,
  verifyCode,
  resetUserPassword,
  getAllUsers,
  getUser,
  getAllUserTypes,
};
