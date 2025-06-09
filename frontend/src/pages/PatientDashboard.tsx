import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Chip,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  LocalHospital as HospitalIcon,
  Assignment as AssignmentIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';

// Mock data - replace with actual API calls
const mockPatientData = {
  name: 'John Doe',
  age: 45,
  gender: 'Male',
  bloodType: 'O+',
  lastCheckup: '2024-02-15',
  nextAppointment: '2024-03-25',
  doctor: 'Dr. Smith',
};

const mockUpcomingAppointments = [
  {
    id: 1,
    date: '2024-03-25',
    time: '09:00 AM',
    type: 'Check-up',
    doctor: 'Dr. Smith',
    status: 'Confirmed',
  },
  {
    id: 2,
    date: '2024-04-01',
    time: '10:30 AM',
    type: 'Follow-up',
    doctor: 'Dr. Johnson',
    status: 'Pending',
  },
];

const mockRecentRecords = [
  {
    id: 1,
    date: '2024-02-15',
    type: 'Blood Test Results',
    doctor: 'Dr. Smith',
    status: 'Completed',
  },
  {
    id: 2,
    date: '2024-01-20',
    type: 'X-Ray Report',
    doctor: 'Dr. Johnson',
    status: 'Completed',
  },
];

const mockNotifications = [
  {
    id: 1,
    message: 'Your appointment with Dr. Smith is tomorrow at 9:00 AM',
    date: '2024-03-24',
    type: 'appointment',
  },
  {
    id: 2,
    message: 'Your blood test results are now available',
    date: '2024-03-20',
    type: 'results',
  },
];

const statusColors = {
  Confirmed: 'success',
  Pending: 'warning',
  Cancelled: 'error',
};

export default function PatientDashboard() {
  const [patientData, setPatientData] = useState(mockPatientData);

  useEffect(() => {
    // TODO: Fetch actual patient data from API
  }, []);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Welcome, {patientData.name}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Personal Information
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Age"
                    secondary={patientData.age}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Gender"
                    secondary={patientData.gender}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Blood Type"
                    secondary={patientData.bloodType}
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Primary Doctor"
                    secondary={patientData.doctor}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Upcoming Appointments
              </Typography>
              <Button
                variant="contained"
                startIcon={<CalendarIcon />}
                onClick={() => {
                  // TODO: Navigate to appointments page
                }}
              >
                Schedule New
              </Button>
            </Box>
            <List>
              {mockUpcomingAppointments.map((appointment, index) => (
                <Box key={appointment.id}>
                  <ListItem>
                    <ListItemText
                      primary={`${appointment.type} with ${appointment.doctor}`}
                      secondary={`${appointment.date} at ${appointment.time}`}
                    />
                    <Chip
                      label={appointment.status}
                      color={statusColors[appointment.status as keyof typeof statusColors]}
                      size="small"
                    />
                  </ListItem>
                  {index < mockUpcomingAppointments.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Recent Medical Records
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AssignmentIcon />}
                onClick={() => {
                  // TODO: Navigate to medical records page
                }}
              >
                View All
              </Button>
            </Box>
            <List>
              {mockRecentRecords.map((record, index) => (
                <Box key={record.id}>
                  <ListItem>
                    <ListItemText
                      primary={record.type}
                      secondary={`${record.date} - ${record.doctor}`}
                    />
                    <Chip
                      label={record.status}
                      color={statusColors[record.status as keyof typeof statusColors]}
                      size="small"
                    />
                  </ListItem>
                  {index < mockRecentRecords.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <NotificationsIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                Notifications
              </Typography>
            </Box>
            <List>
              {mockNotifications.map((notification, index) => (
                <Box key={notification.id}>
                  <ListItem>
                    <ListItemText
                      primary={notification.message}
                      secondary={notification.date}
                    />
                  </ListItem>
                  {index < mockNotifications.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 