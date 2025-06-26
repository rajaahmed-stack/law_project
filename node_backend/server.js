require('dotenv').config();
const express = require('express');
const app = express(); // ✅ Initialize before use
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const nodemailer = require('nodemailer');
const router = express.Router();
const archiver = require('archiver'); // Ensure archiver is imported
const twilio = require('twilio');


const port = 5000;


// Middleware

// Route imports
const surveyRoutes = require('./survey');
const permissionRoutes = require('./permission');
const safetyRoutes = require('./safety');
const workExecutionRoutes = require('./workExecution');
const permissionClosingRoutes = require('./permissionclosing');
const workClosingRoutes = require('./workclosing');
const drawingdepartment = require('./drawingdep');
const gisdepartment = require('./gis');
const management = require('./management');
const store = require('./store');
const invoiceroute = require('./invoice');
const labroute = require('./lab');
const eam = require('./emergencyandmaintainence');
const usermanagement = require('./usermanagement');

// MySQL connection
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: ['https://mmcmadina.com'],
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: ['Content-Type']
}));

// MySQL connection
const db = mysql.createConnection({
  host: process.env.MYSQL_HOST || 'switchback.proxy.rlwy.net',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'jQzrIcHDSWWTnpQcsvPQGqoMYVWQHkrF',
  database: process.env.MYSQL_DATABASE || 'railway',
  port: process.env.MYSQL_PORT || '50403',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0

});


db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Database connected: law');
  }
});

// Ensure uploads directory exists
// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });


// Serve uploaded files
app.use('/uploads', express.static(uploadDir));

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'rb4733164@gmail.com',
    pass: process.env.EMAIL_PASS || 'snsv qxhd uicg rhwc',// App password (not your main password)
  },
});

// Function to send email
const sendEmail = (to, subject, text) => {
  const mailOptions = {
    from: 'rb4733164@gmail.com',
    to,
    subject,
    text,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('Error sending email:', err);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};
app.post('/api/send-email', (req, res) => {
  const { to, subject, text } = req.body;
  sendEmail(to, subject, text);
  res.status(200).send('Email request received');
});

const accountSid = process.env.TWILIO_Account_Id || 'ACf0c1b3d2e4c5a6b7c8d9e0f1g2h3i4j5';
const authToken = process.env.TWILIO_Auth_Token || '542f6a74d054485d9d6a4b8317cd2ed4';

if (!accountSid || !authToken) {
  console.error("❌ Twilio credentials missing in environment variables!");
  process.exit(1);
}
;
const client = new twilio(accountSid, authToken);

app.post('/api/send-whatsapp', async (req, res) => {
  const { phone, caseTitle, hearingDate,court, current_judge, client_name } = req.body;
  const message = `Dear ${client_name},

This is a reminder regarding your legal case:

Case Title: "${caseTitle}"  
Court: ${court}  
Presiding Judge: ${current_judge}  
Hearing Date: ${new Date(hearingDate).toDateString()}  

Please ensure you are prepared and present for the hearing. If you have any questions or need further assistance, feel free to contact us.

Best regards,  
Raja Ahmed Mustafa`;

  try {
    await client.messages.create({
      from: 'whatsapp:+14155238886', // Twilio sandbox number
      to: `whatsapp:${phone}`,
      body: message,
    });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('WhatsApp send error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Root route
app.get('/server', (req, res) => {
  res.send('Welcome to Law Firm API');
});

// Avoid duplicate GET route for /api/LegalCases
app.get('/api/legal_cases', (req, res) => {
  const query = 'SELECT * FROM LegalCases';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      res.status(500).send('Database query error');
    } else {
      res.json(results);
    }
  });
});

// Save work_receiving data
app.post('/api/save-LegalCases', upload.array('file_path'), (req, res) => {
  const {
    case_num,
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

  // Process uploaded files into a comma-separated string of paths (if any)
  const documentFilePath = req.files?.map(file => path.join('uploads', file.filename)).join(',') || null;

  // Basic validation - adjust as needed
  if (!case_title || !client_name || !client_phone) {
    return res.status(400).send('Case title, client name and phone are required');
  }

  // Check for duplicate case by title and register date (adjust criteria as needed)
  const checkDuplicateQuery = `SELECT COUNT(*) AS count FROM LegalCases WHERE case_title = ? AND case_register_date = ?`;
  db.query(checkDuplicateQuery, [case_title, case_register_date], (err, results) => {
    if (err) {
      console.error('Error checking duplicate:', err);
      return res.status(500).send('Error checking for duplicate entry');
    }

    if (results[0].count > 0) {
      return res.status(400).send('Duplicate entry: Case already exists');
    }

    // Start transaction
    db.beginTransaction(err => {
      if (err) {
        console.error('Error starting transaction:', err);
        return res.status(500).send('Error initializing transaction');
      }

      const insertQuery = `
        INSERT INTO LegalCases 
          (case_num, case_title, court, date_of_hearing, case_register_date, current_judge, nature_of_case, representing, stage_and_status, file_in_possession, file_description, client_name, client_phone, client_address, client_cnic, file_path) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(insertQuery, [
        case_num, case_title, court, date_of_hearing, case_register_date, current_judge, nature_of_case,
        representing, stage_and_status, file_in_possession, file_description, client_name,
        client_phone, client_address, client_cnic, documentFilePath
      ], (err) => {
        if (err) {
          return db.rollback(() => {
            console.error('Error saving LegalCases data:', err);
            res.status(500).send('Database error while saving case data');
          });
        }

        db.commit(err => {
          if (err) {
            return db.rollback(() => {
              console.error('Transaction commit failed:', err);
              res.status(500).send('Transaction commit failed');
            });
          }

          res.json({
            message: "Case added successfully",
            reminder: {
              title: req.body.case_title,
              date: req.body.date_of_hearing.slice(0, 10), // Format: 'YYYY-MM-DD'
            }
          });
          
        });
      });
    });
  });
});
app.post("/api/todos", (req, res) => {
  const { title, description, due_date } = req.body;
  const query = "INSERT INTO todos (title, description, due_date) VALUES (?, ?, ?)";
  db.query(query, [title, description, due_date], (err, result) => {
    if (err) {
      console.error("Error adding todo:", err);
      return res.status(500).json({ error: "Insert failed" });
    }
    res.json({ message: "To-do added", id: result.insertId });
  });
});
app.get("/api/todos", (req, res) => {
  db.query("SELECT * FROM todos ORDER BY due_date ASC", (err, results) => {
    if (err) {
      console.error("Error fetching todos:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});
app.get('/api/management-data', (req, res) => {
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
// Download file by work_order_id
app.get('/api/download/:id', (req, res) => {
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


// Update current department



// Function to send email


// Add a new user and send a confirmation email
// Add a new user and send a confirmation email
// Add a new user and send confirmation email
const bcrypt = require('bcryptjs');

app.post('/api/usermanagement/save_users', async (req, res) => {
  const { name, email, password, username } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10); // Encrypt password

  const query = 'INSERT INTO users (name, email, password, department) VALUES (?, ?, ?, ?)';

  db.query(query, [name, email, hashedPassword, username], (err, results) => {
    if (err) {
      console.error('Error adding user:', err);
      return res.status(500).send('Server error');
    }

    // Email with original password (ok only during signup)
    sendEmail(email, 'User Registration', `Username: ${username}\nPassword: ${password}`);
    res.send('User registered');
  });
});


app.post('/api/usermanagement/save_users', (req, res) => {
  const { name, email, password, username } = req.body;
  const query = 'INSERT INTO users (name, email, password, department) VALUES (?, ?, ?, ?)';

  db.query(query, [name, email, password, username], (err, results) => {
    if (err) {
      console.error('Error adding user:', err);
      return res.status(500).send('Server error');
    }

    // Send confirmation email with department-specific username and password
    const subject = 'User Registration Confirmation';
    const text = `Hello ${name},\n\nYour registration was successful! Your login details are:\n\nUsername: ${username}\nPassword: ${password}\n\nThank you for joining us.`;
    sendEmail(email, subject, text);

    // Fetch all users after adding the new one
    db.query('SELECT * FROM users', (err, results) => {
      if (err) {
        console.error('Error fetching users:', err);
        return res.status(500).send('Server error');
      }
      res.status(201).json(results); // Send back the updated list of users
    });
  });
});
// Get all users


// Update user details
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;
  const query = 'UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?';

  db.query(query, [name, email, password, id], (err, results) => {
    if (err) {
      console.error('Error updating user:', err);
      return res.status(500).send('Server error');
    }
    res.send('User updated successfully');
  });
});

// Delete a user
app.delete('/api/delete-users/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM users WHERE id = ?';

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error deleting user:', err);
      return res.status(500).send('Server error');
    }
    res.send('User deleted successfully');
  });
});

// Define API route for fetching users
app.get('/api/clients', (req, res) => {
    // Assuming you want to fetch users from a database or some data source
    const query = 'SELECT  client_name , client_phone , client_address ,client_cnic  FROM LegalCases'; // Adjust based on your database schema
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            res.status(500).send('Error fetching users');
        } else {
            res.json(results);
        }
    });
});
app.get('/api/users', (req, res) => {
    // Assuming you want to fetch users from a database or some data source
    const query = 'SELECT  *  FROM users'; // Adjust based on your database schema
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            res.status(500).send('Error fetching users');
        } else {
            res.json(results);
        }
    });
});
app.get('/api/recent-cases', (req, res) => {
    // Assuming you want to fetch users from a database or some data source
    const query = ' SELECT case_id, case_num, case_title, court, date_of_hearing, case_register_date FROM LegalCases ORDER BY create_at DESC LIMIT 5'; // Adjust based on your database schema
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            res.status(500).send('Error fetching users');
        } else {
            res.json(results);
        }
    });
});
app.post('/api/save_users', (req, res) => {
  const { username, name, email, password } = req.body;  // Add this line
  console.log("Received data:", req.body);
  const query = 'INSERT INTO users (username, name, email, password) VALUES (?, ?, ?, ?)';

  db.query(query, [username,name, email, password], (err, results) => {
      if (err) {
          console.error('Error adding user:', err);
          return res.status(500).send('Server error');
      }

      // Send confirmation email
      const subject = 'User Registration Confirmation';
      const text = `Hello ${name},\n\nYour registration was successful!\n\nThank you for joining us.`;
      sendEmail(email, subject, text); // Send email after adding user

      return res.status(201).send('User added successfully');
  });
});

app.get("/api/stats", (req, res) => {
  db.query('SELECT COUNT(*) as totalCases FROM LegalCases', (err, casesResult) => {
    if (err) return res.status(500).json({ error: "Database error" });

    db.query('SELECT COUNT(DISTINCT client_name) as totalClients FROM LegalCases', (err, clientsResult) => {
      if (err) return res.status(500).json({ error: "Database error" });

      db.query(`SELECT COUNT(*) as active FROM LegalCases WHERE stage_and_status NOT LIKE '%Closed%'`, (err, casesActive) => {
        if (err) return res.status(500).json({ error: "Database error" });

        db.query(`SELECT COUNT(*) as closed FROM LegalCases WHERE stage_and_status LIKE '%Closed%'`, (err, casesClosed) => {
          if (err) return res.status(500).json({ error: "Database error" });

          res.json({
            totalProjects: casesResult[0].totalCases,
            totalUsers: clientsResult[0].totalClients,
            casesWon: casesActive[0].active,
            casesLost: casesClosed[0].closed,
          });
        });
      });
    });
  });
});

// API to return project statistics
app.use('/api/management', management);

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

