// backend/controllers/appointmentController.js
const db = require('../db');
const { getServiceById } = require('./serviceController'); // To get service duration

// Helper function to check slot availability (can be more sophisticated)
async function isSlotTrulyAvailable(stylistId, serviceId, appointmentStartTimeString) {
    const service = await getServiceById(serviceId); // Ensure getServiceById throws if not found
    // No need for: if (!service) throw new Error('Service not found for availability check.'); as getServiceById handles it.
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
        const service = await getServiceById(serviceId); // getServiceById should throw if not found
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
        // const serviceDetails = await getServiceById(newAppointment.service_id); // service object is already fetched above

        // if (customer.rows.length > 0) {
        //   sendBookingConfirmationToCustomer(customer.rows[0].email, newAppointment, serviceDetails); // Use serviceDetails
        //   console.log(`Placeholder: Send booking confirmation to customer ${customer.rows[0].email}`);
        // }
        // if (stylist.rows.length > 0) {
        //   sendNewBookingNotificationToStylist(stylist.rows[0].email, newAppointment, serviceDetails, customer.rows[0]); // Use serviceDetails
        //   console.log(`Placeholder: Send new booking notification to stylist ${stylist.rows[0].email}`);
        // }
        // --- END NOTIFICATION PLACEHOLDERS ---

        res.status(201).json({
            message: 'Appointment booked successfully.',
            appointment: newAppointment, // Use the defined newAppointment
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
                a.appointment_start_time DESC; -- Show most recent or upcoming first
        `;
        const { rows } = await db.query(query, [customerId]);

        if (rows.length === 0) {
            return res.status(200).json([]); // Return empty array if no appointments
        }

        // Map to desired frontend structure
        res.status(200).json(rows.map(row => ({
            appointment_id: row.appointment_id,
            appointment_start_time: row.appointment_start_time,
            appointment_end_time: row.appointment_end_time,
            status: row.status,
            notes: row.notes,
            service: { // Nested service object
                service_id: row.service_id,
                name: row.service_name,
                duration: row.duration_minutes,
                price: row.price
            },
            stylist: { // Nested stylist object
                stylist_id: row.stylist_id,
                first_name: row.stylist_first_name,
                last_name: row.stylist_last_name,
                name: `${row.stylist_first_name} ${row.stylist_last_name}` // Combined name
            },
            // Keep flat structure for direct frontend compatibility if needed by MyAppointmentsPage.jsx
            service_name: row.service_name,
            stylist_name: `${row.stylist_first_name} ${row.stylist_last_name}`
        })));
    } catch (error) {
        console.error('Error fetching customer appointments:', error);
        res.status(500).json({ message: 'Server error while fetching appointments.' });
    }
};
