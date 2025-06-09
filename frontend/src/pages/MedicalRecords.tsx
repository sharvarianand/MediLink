import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';

// Mock data - replace with actual API calls
const mockRecords = [
  {
    id: 1,
    patientName: 'John Doe',
    recordType: 'Medical History',
    date: '2024-03-15',
    doctor: 'Dr. Smith',
    status: 'Completed',
    description: 'Annual check-up and blood work results',
  },
  {
    id: 2,
    patientName: 'Jane Smith',
    recordType: 'Lab Results',
    date: '2024-03-14',
    doctor: 'Dr. Johnson',
    status: 'Pending',
    description: 'Blood test and X-ray results',
  },
  {
    id: 3,
    patientName: 'Mike Johnson',
    recordType: 'Prescription',
    date: '2024-03-13',
    doctor: 'Dr. Williams',
    status: 'Completed',
    description: 'Antibiotics prescription for sinus infection',
  },
];

const statusColors = {
  Completed: 'success',
  Pending: 'warning',
  Archived: 'default',
};

export default function MedicalRecords() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const filteredRecords = mockRecords.filter((record) =>
    Object.values(record).some((value) =>
      value.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleViewRecord = (record: any) => {
    setSelectedRecord(record);
    setIsViewDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsViewDialogOpen(false);
    setSelectedRecord(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Medical Records</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            // TODO: Implement add record functionality
          }}
        >
          New Record
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search records..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ p: 2 }}
        />
      </Paper>

      <Paper>
        <List>
          {filteredRecords.map((record) => (
            <ListItem
              key={record.id}
              divider
              sx={{
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1">{record.patientName}</Typography>
                    <Chip
                      label={record.status}
                      color={statusColors[record.status as keyof typeof statusColors]}
                      size="small"
                    />
                  </Box>
                }
                secondary={
                  <>
                    <Typography variant="body2" color="text.secondary">
                      {record.recordType} - {record.date}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Doctor: {record.doctor}
                    </Typography>
                  </>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  color="primary"
                  onClick={() => handleViewRecord(record)}
                >
                  <ViewIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  color="primary"
                  onClick={() => {
                    // TODO: Implement edit functionality
                  }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  color="error"
                  onClick={() => {
                    // TODO: Implement delete functionality
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog open={isViewDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        {selectedRecord && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{selectedRecord.patientName}</Typography>
                <Chip
                  label={selectedRecord.status}
                  color={statusColors[selectedRecord.status as keyof typeof statusColors]}
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Record Details
                </Typography>
                <Typography variant="body1" paragraph>
                  <strong>Type:</strong> {selectedRecord.recordType}
                </Typography>
                <Typography variant="body1" paragraph>
                  <strong>Date:</strong> {selectedRecord.date}
                </Typography>
                <Typography variant="body1" paragraph>
                  <strong>Doctor:</strong> {selectedRecord.doctor}
                </Typography>
                <Typography variant="body1" paragraph>
                  <strong>Description:</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedRecord.description}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
} 