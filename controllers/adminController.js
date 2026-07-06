import { readData, writeData } from '../utils/db.js';

export const adminController = {
  // GET all admin dashboard data (appointments and queries)
  getAdminData: async (req, res) => {
    try {
      const appointments = await readData('appointments');
      const queries = await readData('contacts');
      res.json({ appointments, queries });
    } catch (error) {
      console.error('Failed to retrieve admin data:', error);
      res.status(500).json({ error: 'Failed to retrieve admin dashboard data' });
    }
  },

  // Update appointment status (Pending, Successful, Completed)
  updateAppointmentStatus: async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Successful', 'Completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be Pending, Successful, or Completed' });
    }

    try {
      const appointments = await readData('appointments');
      const index = appointments.findIndex(apt => apt.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      appointments[index].status = status;
      await writeData('appointments', appointments);

      res.json({ success: true, message: 'Status updated successfully', appointment: appointments[index] });
    } catch (error) {
      console.error('Failed to update status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Toggle archive appointment (set archived: true/false)
  toggleArchiveAppointment: async (req, res) => {
    const { id } = req.params;
    try {
      const appointments = await readData('appointments');
      const index = appointments.findIndex(apt => apt.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      appointments[index].archived = !appointments[index].archived;
      await writeData('appointments', appointments);

      res.json({ 
        success: true, 
        message: appointments[index].archived ? 'Appointment moved to archive' : 'Appointment restored from archive', 
        appointment: appointments[index] 
      });
    } catch (error) {
      console.error('Failed to toggle archive state:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Delete appointment
  deleteAppointment: async (req, res) => {
    const { id } = req.params;
    try {
      const appointments = await readData('appointments');
      const filtered = appointments.filter(apt => apt.id !== id);
      
      if (appointments.length === filtered.length) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      await writeData('appointments', filtered);
      res.json({ success: true, message: 'Appointment deleted successfully' });
    } catch (error) {
      console.error('Failed to delete appointment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Toggle archive query (set archived: true/false)
  toggleArchiveQuery: async (req, res) => {
    const { id } = req.params;
    try {
      const queries = await readData('contacts');
      const index = queries.findIndex(q => q.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Query not found' });
      }

      queries[index].archived = !queries[index].archived;
      await writeData('contacts', queries);

      res.json({ 
        success: true, 
        message: queries[index].archived ? 'Query moved to archive' : 'Query restored from archive', 
        query: queries[index] 
      });
    } catch (error) {
      console.error('Failed to toggle query archive state:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Delete query
  deleteQuery: async (req, res) => {
    const { id } = req.params;
    try {
      const queries = await readData('contacts');
      const filtered = queries.filter(q => q.id !== id);
      
      if (queries.length === filtered.length) {
        return res.status(404).json({ error: 'Query not found' });
      }

      await writeData('contacts', filtered);
      res.json({ success: true, message: 'Query deleted successfully' });
    } catch (error) {
      console.error('Failed to delete query:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};
