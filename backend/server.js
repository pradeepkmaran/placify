const express = require('express');
const multer  = require('multer');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const cors = require('cors');
app.use(cors());

const API_KEY = JSON.parse(Buffer.from(process.env.API_KEY, 'base64').toString('utf-8'));

const uploadsDir = path.join('/tmp', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const SCOPE = ['https://www.googleapis.com/auth/drive'];

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function(req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 } // 10 MB limit
});

async function authorize() { // im just creating jwt using the service account instead of user account
  const jwtClient = new google.auth.JWT(
    API_KEY.client_email,
    null,
    API_KEY.private_key,
    SCOPE
  );
  await jwtClient.authorize();
  return jwtClient;
}

async function appendToSheet(authClient, studentData) {
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEET_ID,
    range: `${process.env.SHEET_NAME}!A:A`,
  });

  const nextSerialNo = response.data.values ? response.data.values.length : 1;

  const { register_number, student_name, company_name, proofLinks } = studentData;

  const values = [
    [nextSerialNo, register_number, student_name, company_name, proofLinks[0] || '', proofLinks[1] || '']
  ];

  sheets.spreadsheets.values.append({
    spreadsheetId: process.env.SHEET_ID,
    range: `${process.env.SHEET_NAME}!A:F`,
    valueInputOption: 'USER_ENTERED',
    resource: { values },
  });

  console.log(`Appended data for ${student_name} to Google Sheets.`);
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

app.post('/api/student/upload', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || !req.body.register_number || !req.body.student_name || !req.body.company_name) {
      return res.status(400).json({ success: false, message: 'Data Missing' });
    }

    const { register_number, student_name, company_name } = req.body;
    const authClient = await authorize();
    const uploadedFiles = [];;
    const proofLinks = [];

    for (const file of req.files) {
      const fileExtension = path.extname(file.originalname);
      const newFileName = `${register_number}_${student_name}_${company_name}_${file.originalname}.${fileExtension}`;
      const newFilePath = path.join(path.dirname(file.path), newFileName);

      fs.renameSync(file.path, newFilePath);

      const driveFile = await uploadFile(authClient, newFilePath, newFileName);
      uploadedFiles.push({ fileName: newFileName, fileId: driveFile.data.id });
      proofLinks.push(`https://drive.google.com/file/d/${driveFile.data.id}/view?usp=sharing`);

      fs.unlink(newFilePath, (err) => {
        if (err) console.error('Error removing temporary file:', err);
      });
    }

    await appendToSheet(authClient, { register_number, student_name, company_name, proofLinks });

    console.log("FILES UPLOADED SUCCESSFULLY:", uploadedFiles);
    res.json({ success: true, files: uploadedFiles });

  } catch (error) {
    console.error("Error in /upload:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/faculty/view-internships', async (req, res) => {
  try {
    const authClient = await authorize();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: `${process.env.SHEET_NAME}!A:F`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return res.json({ success: false, message: "No data found" });
    }
    const headers = rows[0];
    const internships = rows.slice(1).map(row => {
      let obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || "";
      });
      return obj;
    });
    return res.json({ success: true, internships });
  } catch (error) {
    console.error("Error fetching internships:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
