// backend/controllers/appointmentController.js
const db = require('../db');
const { getServiceById } = require('./serviceController'); // To get service duration

// Helper function to check slot availability (can be more sophisticated)
// This is a simplified check. A more robust version might involve parts of getAvailableSlots logic
// or a dedicated database function/procedure for an atomic check-and-book.
async function isSlotTrulyAvailable(stylistId, serviceId, appointmentStartTimeString) {
    const service = await getServiceById(serviceId);
    if (!service) throw new Error('Service not found for availability check.'); // Error will be caught by createAppointment
    const serviceDuration = service.duration_minutes;

    const appointmentStart = new Date(appointmentStartTimeString);
    const appointmentEnd = new Date(appointmentStart.getTime() + serviceDuration * 60000);
    const date = appointmentStartTimeString.split('T')[0];
    const dayOfWeek = appointmentStart.getUTCDay(); // Assuming UTC consistent with scheduleController

    // 1. Check Stylist's general schedule for the day
    const { rows: weeklySchedules } = await db.query(
        'SELECT start_time, end_time FROM stylist_schedules WHERE stylist_id = $1 AND day_of_week = $2 AND is_available = TRUE',
        [stylistId, dayOfWeek]
    );
    if (weeklySchedules.length === 0) return false; // Stylist doesn't work

    let worksDuringSlot = false;
    for (const schedule of weeklySchedules) {
        const workStart = new Date(`${date}T${schedule.start_time}Z`); // Assume times are UTC from DB
        const workEnd = new Date(`${date}T${schedule.end_time}Z`);   // Assume times are UTC from DB
        if (appointmentStart >= workStart && appointmentEnd <= workEnd) {
            worksDuringSlot = true;
            break;
        }
    }
    if (!worksDuringSlot) return false; // Slot is outside stylist's working hours for the day

    // 2. Check for overlapping appointments
    const { rows: appointments } = await db.query(
        `SELECT appointment_id FROM appointments
         WHERE stylist_id = $1 AND status != 'cancelled' AND
         (appointment_start_time < $3 AND appointment_end_time > $2)`, // Overlap condition
        [stylistId, appointmentStart.toISOString(), appointmentEnd.toISOString()]
    );
    if (appointments.length > 0) return false; // Overlaps with an existing appointment

    // 3. Check for overlapping blocked slots
    const { rows: blockedSlots } = await db.query(
        `SELECT block_id FROM blocked_time_slots
         WHERE (stylist_id = $1 OR stylist_id IS NULL) AND
         (start_time < $3 AND end_time > $2)`, // Overlap condition
        [stylistId, appointmentStart.toISOString(), appointmentEnd.toISOString()]
    );
    if (blockedSlots.length > 0) return false; // Overlaps with a blocked slot

    return true;
}


// @desc    Create a new appointment
// @route   POST /api/appointments
// @access  Private (Customer role primarily, maybe Admin)
exports.createAppointment = async (req, res) => {
    const { serviceId, stylistId, appointmentDateTime, notes } = req.body; // appointmentDateTime: "YYYY-MM-DDTHH:MM:00.000Z" (ISO String from client)
    const customerId = req.user.userId; // From authMiddleware

    if (!serviceId || !stylistId || !appointmentDateTime) {
        return res.status(400).json({ message: 'Service ID, Stylist ID, and Appointment Date/Time are required.' });
    }

    try {
        // Fetch service details to get duration
        const service = await getServiceById(serviceId); // This might throw if service not found
        // If getServiceById returns null instead of throwing:
        // if (!service) {
        //     return res.status(404).json({ message: 'Service not found.' });
        // }
        const serviceDuration = service.duration_minutes;
        const appointmentStartTime = new Date(appointmentDateTime);
        const appointmentEndTime = new Date(appointmentStartTime.getTime() + serviceDuration * 60000);

        // **CRITICAL**: Verify slot availability again, as close to transaction as possible
        // The `stylistId` needs to be determined/confirmed here.
        // If "any stylist" was chosen on frontend, one needs to be assigned here based on availability.
        // For now, this controller assumes `stylistId` is provided and confirmed.
        // This is a simplified check. For high concurrency, a DB-level lock or procedure is better.
        const slotStillAvailable = await isSlotTrulyAvailable(stylistId, serviceId, appointmentStartTime.toISOString());
        if (!slotStillAvailable) {
            return res.status(409).json({ message: 'This time slot is no longer available. Please select another.' });
        }

        // Check if the selected stylist is actually a stylist
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

        // Placeholder: Trigger notification (e.g., email to customer and stylist)
        // sendBookingConfirmationEmail(rows[0]);

        res.status(201).json({
            message: 'Appointment booked successfully.',
            appointment: rows[0],
        });

    } catch (error) {
        console.error('Error creating appointment:', error);
        // Catch error from getServiceById if it throws 'Service...not found'
        if (error.message && error.message.includes('not found')) {
             return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error while booking appointment.' });
    }
};

// Placeholder for other appointment management functions (get, update, cancel)
exports.getCustomerAppointments = async (req, res) => {
    // To be implemented in a later step
    res.status(501).json({ message: "Endpoint not yet implemented." });
};
