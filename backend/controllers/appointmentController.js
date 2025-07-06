// backend/controllers/appointmentController.js
const db = require('../db');
const { getServiceById } = require('./serviceController'); // Used by other functions

// Helper function to check slot availability (can be more sophisticated)
async function isSlotTrulyAvailable(stylistId, serviceId, appointmentStartTimeString) {
    const service = await getServiceById(serviceId); // Ensure getServiceById throws if not found
    const serviceDuration = service.duration_minutes;

    const appointmentStart = new Date(appointmentStartTimeString);
    const appointmentEnd = new Date(appointmentStart.getTime() + serviceDuration * 60000);
    const date = appointmentStartTimeString.split('T')[0];
    const dayOfWeek = appointmentStart.getUTCDay();

    const { rows: weeklySchedules } = await db.query(
        'SELECT start_time, end_time FROM stylist_schedules WHERE stylist_id = $1 AND day_of_week = $2 AND is_available = TRUE',
        [stylistId, dayOfWeek]
    );
    if (weeklySchedules.length === 0) return false;

    let worksDuringSlot = false;
    for (const schedule of weeklySchedules) {
        const workStart = new Date(`${date}T${schedule.start_time}Z`);
        const workEnd = new Date(`${date}T${schedule.end_time}Z`);
        if (appointmentStart >= workStart && appointmentEnd <= workEnd) {
            worksDuringSlot = true;
            break;
        }
    }
    if (!worksDuringSlot) return false;

    const { rows: appointments } = await db.query(
        `SELECT appointment_id FROM appointments
         WHERE stylist_id = $1 AND status != 'cancelled' AND
         (appointment_start_time < $3 AND appointment_end_time > $2)`,
        [stylistId, appointmentStart.toISOString(), appointmentEnd.toISOString()]
    );
    if (appointments.length > 0) return false;

    const { rows: blockedSlots } = await db.query(
        `SELECT block_id FROM blocked_time_slots
         WHERE (stylist_id = $1 OR stylist_id IS NULL) AND
         (start_time < $3 AND end_time > $2)`,
        [stylistId, appointmentStart.toISOString(), appointmentEnd.toISOString()]
    );
    if (blockedSlots.length > 0) return false;

    return true;
}

// @desc    Create a new appointment
// @route   POST /api/appointments
// @access  Private (Customer role primarily, maybe Admin)
exports.createAppointment = async (req, res) => {
    const { serviceId, stylistId, appointmentDateTime, notes } = req.body;
    const customerId = req.user.userId;

    if (!serviceId || !stylistId || !appointmentDateTime) {
        return res.status(400).json({ message: 'Service ID, Stylist ID, and Appointment Date/Time are required.' });
    }

    try {
        const service = await getServiceById(serviceId);
        const serviceDuration = service.duration_minutes;
        const appointmentStartTime = new Date(appointmentDateTime);
        const appointmentEndTime = new Date(appointmentStartTime.getTime() + serviceDuration * 60000);

        const slotStillAvailable = await isSlotTrulyAvailable(stylistId, serviceId, appointmentStartTime.toISOString());
        if (!slotStillAvailable) {
            return res.status(409).json({ message: 'This time slot is no longer available. Please select another.' });
        }

        const {rows: stylistUser} = await db.query(
            "SELECT role_id FROM users WHERE user_id = $1 AND role_id = (SELECT role_id FROM user_roles WHERE role_name = 'stylist')",
            [stylistId]
        );
        if(stylistUser.length === 0){
            return res.status(400).json({ message: 'Invalid Stylist ID or user is not a stylist.' });
        }

        const query = `
            INSERT INTO appointments (customer_id, stylist_id, service_id, appointment_start_time, appointment_end_time, notes, status)
            VALUES ($1, $2, $3, $4, $5, $6, 'booked')
            RETURNING *;
        `;
        const values = [customerId, stylistId, serviceId, appointmentStartTime.toISOString(), appointmentEndTime.toISOString(), notes];

        const { rows } = await db.query(query, values);
        const newAppointment = rows[0];

        // --- NOTIFICATION PLACEHOLDERS ---
        // const customer = await db.query('SELECT email, first_name FROM users WHERE user_id = $1', [newAppointment.customer_id]);
        // const stylist = await db.query('SELECT email, first_name FROM users WHERE user_id = $1', [newAppointment.stylist_id]);
        // const serviceDetails = await getServiceById(newAppointment.service_id);

        // if (customer.rows.length > 0) {
        //   sendBookingConfirmationToCustomer(customer.rows[0].email, newAppointment, serviceDetails);
        //   console.log(`Placeholder: Send booking confirmation to customer ${customer.rows[0].email}`);
        // }
        // if (stylist.rows.length > 0) {
        //   sendNewBookingNotificationToStylist(stylist.rows[0].email, newAppointment, serviceDetails, customer.rows[0]);
        //   console.log(`Placeholder: Send new booking notification to stylist ${stylist.rows[0].email}`);
        // }
        // --- END NOTIFICATION PLACEHOLDERS ---

        res.status(201).json({
            message: 'Appointment booked successfully.',
            appointment: newAppointment,
        });

    } catch (error) {
        console.error('Error creating appointment:', error);
        if (error.message && error.message.includes('not found')) {
             return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error while booking appointment.' });
    }
};

// @desc    Get appointments for the logged-in customer
// @route   GET /api/appointments/my-appointments
// @access  Private (Customer)
exports.getMyAppointments = async (req, res) => {
    const customerId = req.user.userId;

    try {
        const query = `
            SELECT
                a.appointment_id,
                a.appointment_start_time,
                a.appointment_end_time,
                a.status,
                a.notes,
                s.service_id,
                s.service_name,
                s.duration_minutes,
                s.price,
                st.user_id as stylist_id,
                st.first_name as stylist_first_name,
                st.last_name as stylist_last_name
            FROM
                appointments a
            JOIN
                services s ON a.service_id = s.service_id
            JOIN
                users st ON a.stylist_id = st.user_id
            WHERE
                a.customer_id = $1
            ORDER BY
                a.appointment_start_time DESC;
        `;
        const { rows } = await db.query(query, [customerId]);

        if (rows.length === 0) {
            return res.status(200).json([]);
        }

        res.status(200).json(rows.map(row => ({
            appointment_id: row.appointment_id,
            appointment_start_time: row.appointment_start_time,
            appointment_end_time: row.appointment_end_time,
            status: row.status,
            notes: row.notes,
            service: {
                service_id: row.service_id,
                name: row.service_name,
                duration: row.duration_minutes,
                price: row.price
            },
            stylist: {
                stylist_id: row.stylist_id,
                first_name: row.stylist_first_name,
                last_name: row.stylist_last_name,
                name: `${row.stylist_first_name} ${row.stylist_last_name}`
            },
            service_name: row.service_name,
            stylist_name: `${row.stylist_first_name} ${row.stylist_last_name}`
        })));
    } catch (error) {
        console.error('Error fetching customer appointments:', error);
        res.status(500).json({ message: 'Server error while fetching appointments.' });
    }
};

// @desc    Update an appointment's status
// @route   PATCH /api/appointments/:appointmentId/status
// @access  Private (Stylist for their appointments, Admin for any, Customer for cancelling their own)
exports.updateAppointmentStatus = async (req, res) => {
    const { appointmentId } = req.params;
    const { status } = req.body;
    const { userId, role } = req.user; // from authMiddleware

    const allowedStatuses = ['booked', 'completed', 'cancelled', 'no-show'];
    if (!status || !allowedStatuses.includes(status.toLowerCase())) {
        return res.status(400).json({
            message: `Invalid status. Allowed statuses are: ${allowedStatuses.join(', ')}.`
        });
    }
    const newStatus = status.toLowerCase();

    try {
        const { rows: appointments } = await db.query(
            'SELECT * FROM appointments WHERE appointment_id = $1',
            [appointmentId]
        );

        if (appointments.length === 0) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }
        const appointment = appointments[0];

        // Authorization checks
        if (role === 'stylist' && appointment.stylist_id !== userId) {
            return res.status(403).json({ message: 'Stylist not authorized to update this appointment.' });
        }
        if (role === 'customer' && appointment.customer_id !== userId) {
            // This check is crucial for customer cancellation
            return res.status(403).json({ message: 'Customer not authorized to modify this appointment.' });
        }
        // Admins can update any appointment (implicitly allowed if they pass route authorization)

        // --- Refined Logic for Customer Cancellation ---
        if (newStatus === 'cancelled' && role === 'customer') {
            // 1. Check if already cancelled
            if (appointment.status === 'cancelled') {
                return res.status(200).json(appointment); // Or a message: "Appointment already cancelled."
            }
            // 2. Check if appointment is in a state that allows cancellation by customer (e.g., only 'booked')
            if (appointment.status !== 'booked') {
                 return res.status(400).json({ message: `Cannot cancel an appointment that is currently ${appointment.status}.` });
            }
            // 3. Time-based cancellation rule
            const now = new Date();
            const appointmentStartTime = new Date(appointment.appointment_start_time);
            const hoursBefore = (appointmentStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);

            const CANCELLATION_WINDOW_HOURS = 24; // This could be a configurable business setting later
            if (hoursBefore < CANCELLATION_WINDOW_HOURS) {
                return res.status(403).json({
                    message: `Cannot cancel appointment. Must be at least ${CANCELLATION_WINDOW_HOURS} hours in advance.`
                });
            }
        }

        // --- General Status Transition Rules (can be expanded) ---
        // Prevent stylists/admins from completing/no-showing an appointment already cancelled by anyone
        if ((newStatus === 'completed' || newStatus === 'no-show') && appointment.status === 'cancelled') {
            return res.status(400).json({ message: `Cannot mark a cancelled appointment as ${newStatus}.` });
        }
        // Prevent cancelling an appointment that is already definitively completed or marked as no-show
        // (Customer cancellation is handled above for 'booked' status)
        if (newStatus === 'cancelled' && (appointment.status === 'completed' || appointment.status === 'no-show')) {
             return res.status(400).json({ message: `Cannot cancel an appointment that is already ${appointment.status}.` });
        }
        // Prevent re-booking a non-booked appointment via this status update (booking should use createAppointment)
        if (newStatus === 'booked' && appointment.status !== 'booked' && role !== 'admin') { // Admin might re-book/fix
            return res.status(400).json({ message: `This action cannot be used to re-book. Current status: ${appointment.status}`})
        }

        // Update the status
        const { rows: updatedAppointments } = await db.query(
            'UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE appointment_id = $2 RETURNING *',
            [newStatus, appointmentId]
        );

        // --- NOTIFICATION PLACEHOLDER ---
        // Fetch customer and stylist emails if needed for notifications
        // if (newStatus === 'cancelled') {
        //   console.log(`Placeholder: Appointment ${appointmentId} cancelled by ${role} (ID: ${userId}). Notify relevant parties.`);
        // } else {
        //   console.log(`Placeholder: Appointment ${appointmentId} status changed to ${newStatus} by ${role} (ID: ${userId}). Notify.`);
        // }
        // --- END NOTIFICATION PLACEHOLDER ---

        res.status(200).json(updatedAppointments[0]);

    } catch (error) {
        console.error('Error updating appointment status:', error);
        res.status(500).json({ message: 'Server error while updating appointment status.' });
    }
};
