import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Paper, TextField, Button, Typography, Box,
  IconButton, Snackbar
} from '@mui/material';
import { Save, AttachFile, Close } from '@mui/icons-material';

const WorkRceiving  = () => {
  const initialData = {
    case_title: '',
    court: '',
    date_of_hearing: '',
    case_register_date: '',
    current_judge: '',
    nature_of_case: '',
    representing: '',
    stage_and_status: '',
    file_in_possession: '',
    file_description: '',
    client_name: '',
    client_phone: '',
    client_address: '',
    client_cnic: '',
  };

  const [formData, setFormData] = useState(initialData);
  const [files, setFiles] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [legalCases, setLegalCases] = useState([]);
    const [reminders, setReminders] = useState([]);
  

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await fetch('https://lawproject-production.up.railway.app/api/legal_cases');
        const data = await res.json();
        setLegalCases(data);
      } catch (error) {
        console.error('Error fetching legal cases:', error);
      }
    };
    fetchCases();
  }, []);
  const handleSubmit = async () => {
    if (!formData.case_title.trim() || !formData.client_name.trim()) {
      setSnackbar({ open: true, message: 'Case Title and Client Name are required!', severity: 'error' });
      return;
    }
  
    if (files.length === 0) {
      setSnackbar({ open: true, message: 'Please upload at least one file!', severity: 'warning' });
      return;
    }
  
    try {
      const formPayload = new FormData();
  
      for (let key in formData) {
        formPayload.append(key, formData[key]);
      }
  
      files.forEach(file => formPayload.append('file_path', file)); // match backend multer field
  
      const response = await fetch('https://lawproject-production.up.railway.app/api/save-LegalCases', {
        method: 'POST',
        body: formPayload,
      });
  
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText);
      }
      
      // Send WhatsApp notification
      await fetch('https://lawproject-production.up.railway.app/api/send-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formData.client_phone,
          caseTitle: formData.case_title,
          hearingDate: formData.date_of_hearing,
          court: formData.court,
          current_judge: formData.current_judge,
          client_name: formData.client_name
        }),
      });
       // Auto-add reminder
    const { title, date } = response.data.reminder;
    const newReminder = {
      id: Date.now(), // or use backend-generated ID
      title,
      date,
      description: `Reminder for hearing of "${title}"`, // optional
    };
    setReminders((prev) => [...prev, newReminder]);
    }
    catch (err) {
      setSnackbar({ open: true, message: err.message || 'Failed to save', severity: 'error' });
    }
  };
  
  return (
    <Container maxWidth="md" sx={{ my: 5 }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
        Legal Case Management
      </Typography>

      {/* Upper Data - Case Info */}
      <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 3, color: 'primary.main', fontWeight: '600' }}>
          Case Information
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label="Case ID *"
              name="case_num"
              fullWidth
              value={formData.case_num}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Case Title *"
              name="case_title"
              fullWidth
              value={formData.case_title}
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField label="Court" name="court" fullWidth value={formData.court} onChange={handleChange} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Date of Hearing"
              name="date_of_hearing"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.date_of_hearing}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Case Register Date"
              name="case_register_date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.case_register_date}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField label="Current Judge" name="current_judge" fullWidth value={formData.current_judge} onChange={handleChange} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField label="Nature of Case" name="nature_of_case" fullWidth value={formData.nature_of_case} onChange={handleChange} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField label="Representing" name="representing" fullWidth value={formData.representing} onChange={handleChange} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField label="Stage and Status" name="stage_and_status" fullWidth value={formData.stage_and_status} onChange={handleChange} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField label="File in Possession" name="file_in_possession" fullWidth value={formData.file_in_possession} onChange={handleChange} />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="File Description"
              name="file_description"
              fullWidth
              multiline
              rows={3}
              value={formData.file_description}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Lower Data - Client Info */}
      <Paper elevation={3} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 3, color: 'secondary.main', fontWeight: '600' }}>
          Client Information
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Client Name *"
              name="client_name"
              fullWidth
              required
              value={formData.client_name}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Client Phone"
              name="client_phone"
              fullWidth
              value={formData.client_phone}
              onChange={handleChange}
              placeholder="+92..."
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Client Address"
              name="client_address"
              fullWidth
              multiline
              rows={2}
              value={formData.client_address}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Client CNIC"
              name="client_cnic"
              fullWidth
              value={formData.client_cnic}
              onChange={handleChange}
              placeholder="XXXXX-XXXXXXX-X"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* File Upload */}
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button variant="outlined" component="label" startIcon={<AttachFile />}>
            Upload Files
            <input type="file" multiple hidden onChange={handleFileChange} />
          </Button>

          <Box sx={{ flexGrow: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {files.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No files selected.
              </Typography>
            )}
            {files.map((file, idx) => (
              <Paper
                key={idx}
                elevation={2}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  maxWidth: 200,
                }}
              >
                <Typography noWrap>{file.name}</Typography>
                <IconButton size="small" onClick={() => removeFile(idx)} color="error" sx={{ ml: 1 }}>
                  <Close fontSize="small" />
                </IconButton>
              </Paper>
            ))}
          </Box>
        </Box>
      </Paper>

      {/* Submit Button */}
      <Box mt={4} display="flex" justifyContent="center">
        <Button
          variant="contained"
          color="secondary"
          size="large"
          startIcon={<Save />}
          onClick={handleSubmit}
          sx={{ px: 6 }}
        >
          Save Case
        </Button>
      </Box>
      <Paper elevation={2} sx={{ p: 3, mt: 4 }}>
  {/* <Typography variant="h6" gutterBottom>Saved Legal Cases</Typography>
  <Grid container spacing={2}>
  {legalCases.map((c, index) => (
    <Grid item xs={12} sm={6} md={4} key={index}>
      <Paper elevation={3} sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{c.case_title}</Typography>
        <Typography variant="body2"><strong>Client:</strong> {c.client_name}</Typography>
        <Typography variant="body2">
          <strong>Hearing:</strong>{' '}
          {c.date_of_hearing ? new Date(c.date_of_hearing).toLocaleDateString() : 'N/A'}
        </Typography>
        <Typography variant="body2"><strong>Court:</strong> {c.court || 'N/A'}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {c.file_description?.slice(0, 60) || 'No description'}...
        </Typography>
      </Paper>
    </Grid>
  ))}
</Grid> */}

</Paper>


      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        autoHideDuration={4000}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
};

export default WorkRceiving ;
