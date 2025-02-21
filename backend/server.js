const express = require('express');
const multer  = require('multer');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const app = express();
const port = process.env.PORT || 3000;

const uploadsDir = path.join('/tmp', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}


const apikeys = JSON.parse(process.env.API_KEY)
const SCOPE = ['https://www.googleapis.com/auth/drive'];

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function(req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

async function authorize() { // im just creating jwt using the service account instead of user account
  const jwtClient = new google.auth.JWT(
    apikeys.client_email,
    null,
    apikeys.private_key,
    SCOPE
  );
  await jwtClient.authorize();
  return jwtClient;
}

async function uploadFile(authClient, filePath, fileName) {
  return new Promise((resolve, reject) => {
    const drive = google.drive({ version: 'v3', auth: authClient });
    const fileMetaData = {
      name: fileName,
      parents: [process.env.DRIVE_FOLDER]
    };

    drive.files.create({
      resource: fileMetaData,
      media: {
        body: fs.createReadStream(filePath),
        mimeType: 'application/octet-stream'
      },
      fields: 'id'
    }, (error, file) => {
      if (error) {
        return reject(error);
      }
      resolve(file);
    });
    console.log("FILE UPLOADED SUCCESSFULLY. FILE: "+ fileMetaData.name)
  });
}

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;
    
    const authClient = await authorize();
    const driveFile = await uploadFile(authClient, filePath, fileName);

    fs.unlink(filePath, (err) => {
      if (err) console.error('Error removing temporary file:', err);
    });

    console.log("FILE UPLOADED SUCCESSFULLY. FILE ID: " + driveFile.data.id);
    res.json({ success: true, fileId: driveFile.data.id });
  } catch (error) {
    console.error("Error in /upload:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
