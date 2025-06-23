// backend/controllers/scheduleController.js
const db = require('../db');
const { getServiceById } = require('./serviceController');


// @desc    Set/Update a stylist's weekly schedule
// @route   POST /api/schedules/stylist/:stylistId
// @access  Private/Admin or Private/Stylist (for their own schedule)
exports.setStylistWeeklySchedule = async (req, res) => {
    const { stylistId } = req.params;
    const { schedules } = req.body; // Expects an array of schedule objects
    // schedules: [{ day_of_week: 1, start_time: '09:00', end_time: '17:00', is_available: true }, ...]

    if (!schedules || !Array.isArray(schedules)) {
        return res.status(400).json({ message: 'Schedules array is required.' });
    }

    // Basic validation for schedule entries
    for (const sched of schedules) {
        if (sched.day_of_week === undefined || sched.start_time === undefined || sched.end_time === undefined) {
            return res.status(400).json({ message: 'Each schedule entry must include day_of_week, start_time, and end_time.' });
        }
        // Add more validation for time format, day_of_week range, etc.
    }

    try {
        // First, clear existing schedule for this stylist to avoid conflicts or use UPSERT
        await db.query('DELETE FROM stylist_schedules WHERE stylist_id = $1', [stylistId]);

        const results = [];
        for (const sched of schedules) {
            const { day_of_week, start_time, end_time, is_available = true } = sched;
            const query = `
                INSERT INTO stylist_schedules (stylist_id, day_of_week, start_time, end_time, is_available)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *;
            `;
            const { rows } = await db.query(query, [stylistId, day_of_week, start_time, end_time, is_available]);
            results.push(rows[0]);
        }

        res.status(201).json({
            message: `Schedule updated successfully for stylist ${stylistId}.`,
            schedules: results,
        });
    } catch (error) {
        console.error('Error setting stylist schedule:', error);
        res.status(500).json({ message: 'Server error while setting schedule.' });
    }
};

// @desc    Get a stylist's weekly schedule
// @route   GET /api/schedules/stylist/:stylistId
// @access  Public or Private (depending on requirements)
exports.getStylistWeeklySchedule = async (req, res) => {
    const { stylistId } = req.params;
    try {
        const { rows } = await db.query('SELECT * FROM stylist_schedules WHERE stylist_id = $1 ORDER BY day_of_week, start_time', [stylistId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'No schedule found for this stylist.' });
        }
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching stylist schedule:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// @desc    Get the logged-in stylist's weekly schedule and upcoming appointments
// @route   GET /api/schedules/stylist/me
// @access  Private (Stylist)
exports.getMyScheduleAndAppointments = async (req, res) => {
    const stylistId = req.user.userId; // From authMiddleware, user must be a stylist

    try {
        // 1. Get weekly schedule
        const { rows: weeklySchedules } = await db.query(
            'SELECT * FROM stylist_schedules WHERE stylist_id = $1 ORDER BY day_of_week, start_time',
            [stylistId]
        );

        // 2. Get upcoming appointments (e.g., from today onwards)
        // Similar to getMyAppointments for customers, but filtered by stylist_id
        // and joining with services and customer (user) details
        const today = new Date().toISOString().split('T')[0] + "T00:00:00.000Z";
        const appointmentsQuery = `
            SELECT
                a.appointment_id,
                a.appointment_start_time,
                a.appointment_end_time,
                a.status,
                a.notes,
                s.service_id,
                s.service_name,
                s.duration_minutes,
                c.user_id as customer_id,
                c.first_name as customer_first_name,
                c.last_name as customer_last_name,
                c.email as customer_email,
                c.phone_number as customer_phone_number
            FROM
                appointments a
            JOIN
                services s ON a.service_id = s.service_id
            JOIN
                users c ON a.customer_id = c.user_id
            WHERE
                a.stylist_id = $1 AND a.appointment_start_time >= $2 AND a.status NOT IN ('cancelled', 'completed', 'no-show')
            ORDER BY
                a.appointment_start_time ASC;
        `;
        const { rows: upcomingAppointmentsData } = await db.query(appointmentsQuery, [stylistId, today]);

        const upcomingAppointments = upcomingAppointmentsData.map(row => ({
            appointment_id: row.appointment_id,
            appointment_start_time: row.appointment_start_time,
            appointment_end_time: row.appointment_end_time,
            status: row.status,
            notes: row.notes,
            service: {
                service_id: row.service_id,
                name: row.service_name,
                duration: row.duration_minutes
            },
            customer: {
                customer_id: row.customer_id,
                first_name: row.customer_first_name,
                last_name: row.customer_last_name,
                email: row.customer_email,
                phone: row.customer_phone_number,
                name: `${row.customer_first_name} ${row.customer_last_name}`
            }
        }));


        res.status(200).json({
            weekly_schedule: weeklySchedules,
            upcoming_appointments: upcomingAppointments
        });

    } catch (error) {
        console.error('Error fetching stylist schedule and appointments:', error);
        res.status(500).json({ message: 'Server error while fetching data.' });
    }
};


// @desc    Get available time slots
// @route   GET /api/availability?serviceId=X&date=YYYY-MM-DD(&stylistId=Y)
// @access  Public
exports.getAvailableSlots = async (req, res) => {
    const { serviceId, date, stylistId: preferredStylistId } = req.query;

    if (!serviceId || !date) {
        return res.status(400).json({ message: 'Service ID and date are required.' });
    }

    try {
        // 1. Get Service Details (especially duration)
        const service = await getServiceById(serviceId); // Use imported function
        if (!service) {
            return res.status(404).json({ message: 'Service not found.' });
        }
        const serviceDuration = service.duration_minutes; // in minutes

        // 2. Determine Target Stylists
        let targetStylistIds = [];
        if (preferredStylistId) {
            // Check if preferred stylist exists and can perform the service (future enhancement)
            const { rows: stylistCheck } = await db.query('SELECT user_id FROM users WHERE user_id = $1 AND role_id = (SELECT role_id FROM user_roles WHERE role_name = $2)', [preferredStylistId, 'stylist']);
            if (stylistCheck.length === 0) {
                return res.status(404).json({ message: 'Preferred stylist not found or is not a stylist.' });
            }
            targetStylistIds.push(preferredStylistId);
        } else {
            // Find all active stylists (future: who can perform this service)
            const { rows: allStylists } = await db.query('SELECT user_id FROM users WHERE role_id = (SELECT role_id FROM user_roles WHERE role_name = $2)', ['stylist']);
            targetStylistIds = allStylists.map(s => s.user_id);
        }

        if (targetStylistIds.length === 0) {
            return res.status(404).json({ message: 'No stylists available.' });
        }

        const requestedDate = new Date(date); // Format: YYYY-MM-DD
        const dayOfWeek = requestedDate.getUTCDay(); // Sunday = 0, Monday = 1, ... (UTC to align with DB if times are naive)

        const availableSlotsByStylist = {};

        for (const stylistId of targetStylistIds) {
            // 3. Get Stylist's General Schedule for that day_of_week
            const { rows: weeklySchedules } = await db.query(
                'SELECT start_time, end_time FROM stylist_schedules WHERE stylist_id = $1 AND day_of_week = $2 AND is_available = TRUE',
                [stylistId, dayOfWeek]
            );

            if (weeklySchedules.length === 0) continue; // Stylist doesn't work on this day

            // Assume studio operates from 00:00 to 23:59 for now, can be refined with studio hours
            // For each work block for the stylist on that day
            for (const schedule of weeklySchedules) {
                let stylistWorkStart = new Date(`${date}T${schedule.start_time}Z`); // Assume times are UTC
                let stylistWorkEnd = new Date(`${date}T${schedule.end_time}Z`);

                // 4. Get Existing Appointments for the stylist on that date
                const { rows: appointments } = await db.query(
                    `SELECT appointment_start_time, appointment_end_time FROM appointments
                     WHERE stylist_id = $1 AND appointment_start_time >= $2 AND appointment_start_time < $3
                     AND status != 'cancelled'`,
                    [stylistId, `${date}T00:00:00Z`, `${date}T23:59:59Z`] // Check full day
                );

                // 5. Get Blocked Time Slots for the stylist on that date
                const { rows: blockedSlots } = await db.query(
                    `SELECT start_time, end_time FROM blocked_time_slots
                     WHERE (stylist_id = $1 OR stylist_id IS NULL) AND start_time < $2 AND end_time > $3`,
                    [stylistId, new Date(`${date}T23:59:59Z`), new Date(`${date}T00:00:00Z`)] // Check overlaps with the day
                );

                // Combine appointments and blocked slots into a single list of busy periods
                const busyPeriods = [];
                appointments.forEach(app => busyPeriods.push({ start: new Date(app.appointment_start_time), end: new Date(app.appointment_end_time) }));
                blockedSlots.forEach(block => busyPeriods.push({ start: new Date(block.start_time), end: new Date(block.end_time) }));
                busyPeriods.sort((a, b) => a.start - b.start);


                // 6. Calculate Available Slots (simplified example: check every 30 mins or serviceDuration step)
                // This logic needs to be robust: iterate from stylistWorkStart to stylistWorkEnd
                let potentialSlotStart = new Date(stylistWorkStart);
                const slotsForStylist = [];

                while (potentialSlotStart < stylistWorkEnd) {
                    let potentialSlotEnd = new Date(potentialSlotStart.getTime() + serviceDuration * 60000);

                    if (potentialSlotEnd > stylistWorkEnd) break; // Slot exceeds working hours

                    let isSlotAvailable = true;
                    for (const busyPeriod of busyPeriods) {
                        // Check for overlap: (StartA < EndB) and (EndA > StartB)
                        if (potentialSlotStart < busyPeriod.end && potentialSlotEnd > busyPeriod.start) {
                            isSlotAvailable = false;
                            break;
                        }
                    }

                    if (isSlotAvailable) {
                        slotsForStylist.push(potentialSlotStart.toISOString().substr(11, 5)); // HH:MM format
                    }

                    // Increment potentialSlotStart (e.g., by 15-minute intervals or service duration)
                    // For this example, let's use 15 min intervals to find more granular slots
                    potentialSlotStart.setTime(potentialSlotStart.getTime() + 15 * 60000);
                }
                if(slotsForStylist.length > 0) {
                    if (!availableSlotsByStylist[stylistId]) availableSlotsByStylist[stylistId] = [];
                    availableSlotsByStylist[stylistId].push(...slotsForStylist);
                    // Remove duplicates if any due to interval logic
                    availableSlotsByStylist[stylistId] = [...new Set(availableSlotsByStylist[stylistId])].sort();
                }
            }
        }
        // For "any stylist", we could try to merge slots or just return per stylist
        // For now, returning slots grouped by stylist if no preferred stylist, or just for the one.
        if (Object.keys(availableSlotsByStylist).length === 0) {
            return res.status(200).json({ message: 'No available slots found for the selected criteria.', slots: [] });
        }

        // If a preferred stylist was given, return only their slots
        if (preferredStylistId && availableSlotsByStylist[preferredStylistId]) {
             res.status(200).json({ stylistId: preferredStylistId, slots: availableSlotsByStylist[preferredStylistId] });
        } else if (preferredStylistId) {
             res.status(200).json({ message: 'No available slots found for the preferred stylist.', slots: [] });
        }
         else {
            // If "any stylist", return all found slots, perhaps merge them or pick the one with most slots
            // For now, just return all, client can pick. Or, a more complex merging logic can be added.
            // Let's flatten for "any stylist" to a single list of unique time slots if multiple stylists offer it.
            let allPossibleSlots = new Set();
            for(const stylist in availableSlotsByStylist){
                availableSlotsByStylist[stylist].forEach(slot => allPossibleSlots.add(slot));
            }
             res.status(200).json({ slots: Array.from(allPossibleSlots).sort() });
        }

    } catch (error) {
        console.error('Error fetching availability:', error);
        res.status(500).json({ message: 'Server error while fetching availability.' });
    }
};

// Placeholder for managing blocked time slots
exports.addBlockedTimeSlot = async (req, res) => {
    const { stylist_id, start_time, end_time, reason } = req.body;
    // stylist_id can be null for studio-wide blocks
    if (!start_time || !end_time) {
        return res.status(400).json({ message: 'Start time and end time are required.' });
    }
    try {
        const query = `INSERT INTO blocked_time_slots (stylist_id, start_time, end_time, reason) VALUES ($1, $2, $3, $4) RETURNING *;`;
        const { rows } = await db.query(query, [stylist_id, start_time, end_time, reason]);
        res.status(201).json({ message: 'Blocked time slot added.', slot: rows[0] });
    } catch (error) {
        console.error('Error adding blocked slot:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};
