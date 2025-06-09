import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

// Mock data - replace with actual API calls
const mockAppointments = [
  {
    id: 1,
    patientName: 'John Doe',
    date: '2024-03-20',
    time: '09:00 AM',
    type: 'Check-up',
    status: 'Scheduled',
    doctor: 'Dr. Smith',
  },
  {
    id: 2,
    patientName: 'Jane Smith',
    date: '2024-03-20',
    time: '10:30 AM',
    type: 'Follow-up',
    status: 'Confirmed',
    doctor: 'Dr. Johnson',
  },
  {
    id: 3,
    patientName: 'Mike Johnson',
    date: '2024-03-20',
    time: '02:00 PM',
    type: 'Consultation',
    status: 'Pending',
    doctor: 'Dr. Williams',
  },
];

const statusColors = {
  Scheduled: 'primary',
  Confirmed: 'success',
  Pending: 'warning',
  Cancelled: 'error',
};

export default function Appointments() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const filteredAppointments = mockAppointments.filter(
    (appointment) => appointment.date === selectedDate.toISOString().split('T')[0]
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Appointments</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            // TODO: Implement add appointment functionality
          }}
        >
          New Appointment
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Calendar View
            </Typography>
            {/* TODO: Implement calendar component */}
            <Box
              sx={{
                height: 400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.100',
                borderRadius: 1,
              }}
            >
              Calendar Component Placeholder
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Today's Appointments
            </Typography>
            {filteredAppointments.map((appointment) => (
              <Card key={appointment.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h6">{appointment.patientName}</Typography>
                    <Box>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => {
                          // TODO: Implement edit functionality
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          // TODO: Implement delete functionality
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography color="text.secondary" gutterBottom>
                    {appointment.time} - {appointment.type}
                  </Typography>
                  <Typography color="text.secondary" gutterBottom>
                    Doctor: {appointment.doctor}
                  </Typography>
                  <Chip
                    label={appointment.status}
                    color={statusColors[appointment.status as keyof typeof statusColors]}
                    size="small"
                  />
                </CardContent>
              </Card>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 