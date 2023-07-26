const express = require("express");
const multer = require("multer");
const path = require("path");
const AdmZip = require("adm-zip");
const fs = require("fs");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");
const webpush = require("web-push");
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const vapidKeys = {
  publicKey: "BBbcw4os1iBKmtHck2tk4aIVipYP0svn6Uno0IxTxxwZEMvmqDYjLX1CKHsyQpwQbmK1uGRBRCK84BwZn-00LBc",
  privateKey: "BcoXQ6h2-0gmrVYTwgFXEARzsPbDuLbJKn29skyD8ms",
};
webpush.setVapidDetails(
  "mailto:ajstylesmb@gmail.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey
);
wss.on("connection", (ws) => {
  // When a client connects, check if the extracted.json file exists
  const extractedFilePath = "./extracted/extracted.json";
  if (fs.existsSync(extractedFilePath)) {
    // If the file exists, read its contents and send to the client
    fs.readFile(extractedFilePath, "utf8", (err, jsonData) => {
      if (err) {
        console.error("Error reading extracted file:", err);
        ws.send(JSON.stringify({ error: "Error reading the file" }));
      } else {
        ws.send(jsonData);
      }
    });
  }
});
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = ``;
    const extname = path.extname(file.originalname);
    cb(null, `${file.fieldname}${extname}`);
  },
});
const upload = multer({ storage });
app.post("/api/upload", upload.single("zipFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  console.log("Enter toh ho raha hai ");
  const zipFilePath = req.file.path;
  const zip = new AdmZip(zipFilePath);
  const destinationPath = "./extracted"; // Destination path for extracting the zip

  const fileToExtract = "tweets.js";
  zip.extractAllTo(destinationPath, true);

  const extractedFilePath = path.join(destinationPath, "data", fileToExtract);

  fs.readFile(extractedFilePath, "utf8", (err, jsonData) => {
    if (err) {
      console.error("Error reading extracted file:", err);
      return res.status(500).json({ error: "Error processing the file" });
    }

    // Write the extracted.json file
    const filepath = "../src/tweets.txt";
    const jsonStartIndex = jsonData.indexOf("["); // Find the first curly brace
    const Data = jsonData.slice(jsonStartIndex);
    fs.writeFile(filepath, Data, (err) => {
      if (err) {
        console.error("Error writing extracted file:", err);
        return res.status(500).json({ error: "Error processing the file" });
      }
      console.log(`File ${fileToExtract} has been saved successfully.`);

      // Notify connected clients (frontend) that the data is ready
      wss.clients.forEach((client) => {
        client.send(jsonData);
      });

      return res
        .status(200)
        .json({ message: "File uploaded and processed successfully" });
    });
  });
});
function sendPushNotification(subscription, payload) {
  webpush.sendNotification(subscription, JSON.stringify(payload));
}
app.post("/api/sendNotification", (req, res) => {
  console.log(req.body.subscription);

  const subscription = req.body.subscription; 
  const payload = {
    title: "New Message",
    body: "You have a new message!",
    image: "https://example.com/image.jpg",
    customData: "Some custom data",
  };

  sendPushNotification(subscription, payload);

  res.status(200).json({ message: "Push notification sent successfully" });
});
app.post("/api/")
const port = 5000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});