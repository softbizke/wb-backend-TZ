// const { Client, LocalAuth } = require("whatsapp-web.js");
// const qrcode = require("qrcode-terminal");

const setUpWhatsAppClientAndSendGroupMessage = (req, res) => {
  
//   //
//     const client = new Client({
//         authStrategy: new LocalAuth(), // Use LocalAuth for persistent sessions
//         puppeteer: {
//             args: ['--no-sandbox', '--disable-setuid-sandbox'],
//         },
//     });
//     client.on("qr", (qr) => {
//       // Generate and display the QR code in the terminal
//       qrcode.generate(qr, { small: true });
//     });

//     client.on("ready", async () => {
//       console.log("Client is ready!");

//       try {
//         // Fetch all chats
//         const chats = await client.getChats();

//         console.log("Chats:", chats);

//         // Find the group by its name
//         const group = chats.find(
//           (chat) =>
//             chat.isGroup &&
//             chat.name.toLowerCase() === process.env.WHATSAPP_GROUP.toLowerCase()
//         );

//         console.log("Group found:", group);

//         if (group) {
//             // get the activity details
//             const activityDetails = await activitiesService.getActivity(
//                 1634 //delivery_order_id
//             );
//             console.log("Activity Details:", activityDetails);

//             const message = `Activity Details:\nOrder Number: ${activityDetails.order_number}\nTruck No: ${activityDetails.truck_no}`;
//             console.log("Message to send:", message);
//             // Send a message to the group
//             await client.sendMessage(group.id._serialized, message);
//             console.log("Message sent to group:", group.name);
//             return res.status(200).json({
//                 success: true,
//                 message: "Message sent to WhatsApp group successfully",
//             });
//         } else {
//           console.log("Group not found");

//             return res.status(400).json({
//                 success: false,
//                 message: "Group not found",
//             });
//         }
//       } catch (error) {
//             console.error("Error sending message:", error);

//             return res.status(400).json({
//                 success: false,
//                 message: error.message || "Failed to send message",
//             });
//       }
//     });

//     client.on('auth_failure', msg => {
//         console.error('AUTHENTICATION FAILURE', msg);
//     });

//     client.on('disconnected', reason => {
//         console.log('Client was logged out', reason);
//     });


//     client.initialize();
};

module.exports = {
  setUpWhatsAppClientAndSendGroupMessage,
};
