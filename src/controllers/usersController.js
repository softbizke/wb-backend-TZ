const users = require("../services/usersService");

// controller for creating or updating a user type
const createUserTypeController = async (req, res) => {
  try {
    const { name, isactive } = req.body || {};

    // Check for missing fields
    if (!name || typeof isactive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
        missingFields: {
          name: !name ? "Blank" : "Provided",
          isactive:
            typeof isactive !== "boolean" ? "Invalid or Blank" : "Provided",
        },
      });
    }

    // Call the service function
    const result = await users.createOrUpdateUserType(name, isactive);

    // Return success response
    if (result.success) {
      return res.status(201).json({ success: true, message: result.message });
    } else {
      return res.status(409).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("Error in createUserTypeController:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// Create a user
const createUser = async (req, res) => {
  const { first_name, last_name, phone, password, user_type, isactive, id_no } =
    req.body;

  // Check for missing fields
  if (
    !first_name ||
    !last_name ||
    !phone ||
    !password ||
    user_type === undefined ||
    isactive === undefined ||
    !id_no
  ) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
      missingFields: {
        first_name: !first_name ? "Blank" : "Provided",
        last_name: !last_name ? "Blank" : "Provided",
        phone: !phone ? "Blank" : "Provided",
        password: !password ? "Blank" : "Provided",
        id_no: !id_no ? "Blank" : "Provided",
        user_type: user_type === undefined ? "Blank" : "Provided",
        isactive: isactive === undefined ? "Blank" : "Provided",
      },
    });
  }

  try {
    // Call the service function to create the user
    const result = await users.createUser(
      first_name,
      last_name,
      phone,
      password,
      id_no,
      user_type,
      isactive
    );

    // Return response based on the result
    if (result.success) {
      return res.status(201).json({ success: true, message: result.message });
    } else {
      return res.status(409).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("Error in controller:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update a user
const updateUser = async (req, res) => {
  const { email, first_name, last_name, password, isactive } = req.body; // Get email and other fields from the body

  try {
    // Validate that email is provided
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Validate that at least one other field (first_name, last_name, password, or isactive) is provided
    if (!first_name && !last_name && !password && isactive === undefined) {
      return res.status(400).json({
        success: false,
        message:
          "At least one field (first_name, last_name, password, or isactive) must be provided",
      });
    }

    const result = await users.updateUser(
      email,
      first_name,
      last_name,
      password,
      isactive
    );

    if (result.success) {
      return res.status(200).json({ success: true, message: result.message });
    } else {
      return res.status(404).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("Error in controller:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//reset user password
const resetUserPassword = async (req, res) => {
  const { phone, newPassword, confirmPassword } = req.body;
  try {
    // Validate input
    if (!phone || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Phone number, new password, and confirm password are required",
      });
    } else if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    } 
    // Call the service function to reset the password
    const result = await users.resetUserPassword(phone, newPassword);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: result.message,
      });
    }
  

  } catch (error) {
    console.error("Error in resetUserPassword:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// validate user and update
const checkUserCredentials = async (req, res) => {
  const { phone, password } = req.body;

  try {
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await users.checkUser(phone, password);

    if (result.success) {
      return res.status(200).json({
        success: true,
        token: result.token, // Include the token from the service
      });
    } else {
      return res.status(401).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error in controller:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// send verification code to user
const sendVerificationCode = async (req, res) => {
  const { phone } = req.body; 
  try {
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }
    const result = await users.sendVerificationCode(phone);
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error in sendVerificationCode:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const verifyCode = async (req, res) => {
  const { phone, code } = req.body; // Get phone and code from the body

  try {
    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: "Phone number and verification code are required",
      });
    }

    const result = await users.verifyCode(phone, code);

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error in verifyCode:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Controller to get all customer types
const getAllUsers = async (req, res) => {
  try {
    // Extract the search query from request parameters
    const { email } = req.query;

    // Call the service function with the search query
    const dbusers = await users.getAllUsers(email);

    // Send the response with the filtered customer types
    res.status(200).json({
      success: true,
      data: dbusers,
    });
  } catch (error) {
    console.error("Error in getAllusers:", error);

    // Send error response
    res.status(500).json({
      success: false,
      message: "Failed to retrieve customer types",
    });
  }
};

// Controller to get specific user
const getUser = async (req, res) => {
  // Extract the search query from request parameters
  //const { email } = req.query;
  //console.log("controller reached");
  //const user_1 = req.user;
  //console.log(user_1.id);

  try {
    console.log("controller reached");
    const user_1 = req.user;
    console.log(user_1.id);

    // Call the service function with the search query
    const dbusers = await users.getUser(user_1.id);
    console.log(dbusers);

    // Send the response with the filtered customer types
    res.status(200).json({
      success: true,
      data: dbusers,
    });
  } catch (error) {
    console.error("Error in getting user:", error);

    // Send error response
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user",
    });
  }
};

const getAllUserTypes = async (req, res) => {
  try {
    // Extract the search query from request parameters
    const { search } = req.query;

    // Call the service function with the search query
    const userTypes = await users.getAllUserTypes(search);

    // Send the response with the filtered customer types
    res.status(200).json({
      success: true,
      data: userTypes,
    });
  } catch (error) {
    console.error("Error in getAllUserType:", error);

    // Send error response
    res.status(500).json({
      success: false,
      message: "Failed to retrieve customer types",
    });
  }
};
module.exports = {
  createUserTypeController,
  createUser,
  updateUser,
  checkUserCredentials,
  sendVerificationCode,
  verifyCode,
  resetUserPassword,
  getAllUsers,
  getAllUserTypes,
  getUser,
};
