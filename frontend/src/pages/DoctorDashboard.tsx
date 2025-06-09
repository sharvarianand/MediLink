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
} from '@mui/material';
import {
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  LocalHospital as HospitalIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Mock data - replace with actual API calls
const mockStats = {
  totalPatients: 1250,
  appointmentsToday: 15,
  activeCases: 45,
  completedRecords: 980,
};

const mockAppointmentData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Appointments',
      data: [12, 19, 15, 17, 22, 8, 10],
      borderColor: 'rgb(37, 99, 235)',
      backgroundColor: 'rgba(37, 99, 235, 0.5)',
    },
  ],
};

const mockPatientData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'New Patients',
      data: [65, 59, 80, 81, 56, 55],
      backgroundColor: 'rgba(16, 185, 129, 0.5)',
    },
  ],
};

const mockUpcomingAppointments = [
  {
    id: 1,
    patientName: 'John Doe',
    time: '09:00 AM',
    type: 'Check-up',
  },
  {
    id: 2,
    patientName: 'Jane Smith',
    time: '10:30 AM',
    type: 'Follow-up',
  },
  {
    id: 3,
    patientName: 'Mike Johnson',
    time: '02:00 PM',
    type: 'Consultation',
  },
];

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Icon sx={{ color, fontSize: 40, mr: 2 }} />
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div">
        {value}
      </Typography>
    </CardContent>
  </Card>
);

export default function DoctorDashboard() {
  const [stats, setStats] = useState(mockStats);

  useEffect(() => {
    // TODO: Fetch actual data from API
  }, []);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Doctor Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Patients"
            value={stats.totalPatients}
            icon={PeopleIcon}
            color="#2563eb"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Appointments"
            value={stats.appointmentsToday}
            icon={CalendarIcon}
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Cases"
            value={stats.activeCases}
            icon={HospitalIcon}
            color="#f59e0b"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed Records"
            value={stats.completedRecords}
            icon={AssignmentIcon}
            color="#6366f1"
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Weekly Appointments
            </Typography>
            <Line
              data={mockAppointmentData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                },
              }}
            />
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Today's Schedule
            </Typography>
            <List>
              {mockUpcomingAppointments.map((appointment, index) => (
                <Box key={appointment.id}>
                  <ListItem>
                    <ListItemText
                      primary={appointment.patientName}
                      secondary={`${appointment.time} - ${appointment.type}`}
                    />
                  </ListItem>
                  {index < mockUpcomingAppointments.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              New Patients (Last 6 Months)
            </Typography>
            <Bar
              data={mockPatientData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                },
              }}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
} 