const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const archiver = require('archiver'); // Ensure archiver is imported

// MySQL Database Connection
const db = mysql.createConnection({
  host: process.env.MYSQL_HOST || 'shinkansen.proxy.rlwy.net',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'XjSGGFPPsszznJyxanyHBVzUeppoFkKn',
  database: process.env.MYSQL_DATABASE || 'law',
  port: process.env.MYSQL_PORT || '44942'

});


db.connect((err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to the database');
  }
});

// Setup multer for file storage
const uploadDir = path.join(__dirname, 'uploads');

// Ensure that the uploads directory exists
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Use the directory where you want to store the files
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Use timestamp to avoid name collisions
  }
});

const upload = multer({ storage: storage });


// Fetch workExecution Coming Data
router.get('/management-data', (req, res) => {
    const query = `
        SELECT 
         
        * FROM LegalCases 
    `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      res.status(500).send('Database query error');
    } else {
      console.log('Legal Cases Fetching Data:', results);  // Log the results
      res.json(results);
    }
  });
});
// Search by Work Order ID
router.get('/search-workorder/:workOrderId', (req, res) => {
  const { workOrderId } = req.params;
  const query = `
    SELECT 
     
    * FROM LegalCases 
    WHERE case_title = ?
  `;

  db.query(query, [workOrderId], (err, results) => {
    if (err) {
      console.error("Search query error:", err);
      res.status(500).send("Error searching work order");
    } else {
      res.json(results);
    }
  });
});
// Search filter by department
router.get('/search-filter', (req, res) => {
  const { value } = req.query;

  if (!value) {
    return res.status(400).send('Missing department value');
  }

  const allowedValues = [
    'Cases Details',
    'Civil Court',
    'High Court',
    'Supreme Court',
    'Special/ Tribunal',
  ];

  if (!allowedValues.includes(value)) {
    return res.status(400).send('Invalid department value');
  }

  let query = '';
  let params = [];

  switch (value) {
    case 'Cases Details':
      query = `SELECT * FROM LegalCases ORDER BY create_at DESC`;
      break;

    case 'Civil Court':
    case 'High Court':
    case 'Supreme Court':
    case 'Special/ Tribunal':
      query = `SELECT * FROM LegalCases WHERE court = ? ORDER BY create_at DESC`;
      params.push(value);
      break;

    default:
      return res.status(400).send('Invalid department');
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching department data:', err);
      res.status(500).send('Error fetching department data');
    } else {
      res.json(results);
    }
  });
});

router.put('/edit-case/:id', upload.array('file_path', 10), (req, res) => {
  const { id } = req.params;
  const {
    case_title,
    court,
    date_of_hearing,
    case_register_date,
    current_judge,
    nature_of_case,
    representing,
    stage_and_status,
    file_in_possession,
    file_description,
    client_name,
    client_phone,
    client_address,
    client_cnic
  } = req.body;

  if (!case_title || !court || !date_of_hearing) {
    return res.status(400).send('Missing required fields');
  }

  // Collect file paths if files uploaded
  let filePaths = null;
  if (req.files && req.files.length > 0) {
    filePaths = req.files.map(file => `/uploads/${file.filename}`).join(',');
  }

  // Build query and values dynamically
  let query = `
    UPDATE LegalCases SET
      case_title = ?, court = ?, date_of_hearing = ?, case_register_date = ?, current_judge = ?,
      nature_of_case = ?, representing = ?, stage_and_status = ?, file_in_possession = ?, file_description = ?,
      client_name = ?, client_phone = ?, client_address = ?, client_cnic = ?
  `;
  const values = [
    case_title, court, date_of_hearing, case_register_date, current_judge,
    nature_of_case, representing, stage_and_status, file_in_possession, file_description,
    client_name, client_phone, client_address, client_cnic
  ];

  if (filePaths) {
    query += `, file_path = ?`;
    values.push(filePaths);
  }

  query += ` WHERE case_num = ?`;
  values.push(id);

  // Execute DB update
  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error updating case:', err);
      return res.status(500).send('Database update error');
    }
    res.send('Case updated successfully');
  });
});
router.get('/api/download/:id', (req, res) => {
  const fileId = req.params.id;

  db.query('SELECT file_path FROM LegalCases WHERE case_num = ?', [fileId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Database error');
    }

    if (results.length === 0) {
      return res.status(404).send('File not found');
    }

    let filePath = results[0].file_path;

    // Convert buffer to string if needed
    if (Buffer.isBuffer(filePath)) {
      filePath = filePath.toString('utf8');
    }

    const filePaths = filePath.split(',');

    if (filePaths.length === 1) {
      // Single file
      const absolutePath = path.resolve(filePaths[0]);
      if (!fs.existsSync(absolutePath)) {
        return res.status(404).send('File not found on server');
      }

      return res.download(absolutePath);
    } else {
      // Multiple files — create a zip
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      res.attachment(`files_${fileId}.zip`);
      archive.pipe(res);

      filePaths.forEach(p => {
        const absPath = path.resolve(p);
        if (fs.existsSync(absPath)) {
          archive.file(absPath, { name: path.basename(p) });
        }
      });

      archive.finalize();
    }
  });
});
module.exports = router;
