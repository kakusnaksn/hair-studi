// backend/controllers/scheduleController.js
const db = require('../db');
const { getServiceById } = require('./serviceController');


// @desc    Set/Update a stylist's weekly schedule
// @route   POST /api/schedules/stylist/:stylistId
// @access  Private/Admin or Private/Stylist (for their own schedule)
exports.setStylistWeeklySchedule = async (req, res) => {
    const { stylistId } = req.params;
    const { schedules } = req.body; // Expects an array of schedule objects

    if (!schedules || !Array.isArray(schedules)) {
        return res.status(400).json({ message: 'Schedules array is required.' });
    }

    for (const sched of schedules) {
        if (sched.day_of_week === undefined || sched.start_time === undefined || sched.end_time === undefined) {
            return res.status(400).json({ message: 'Each schedule entry must include day_of_week, start_time, and end_time.' });
        }
    }

    try {
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

// @desc    Get the logged-in stylist's weekly schedule and appointments within a date range
// @route   GET /api/schedules/stylist/me?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// @access  Private (Stylist)
exports.getMyScheduleAndAppointments = async (req, res) => {
    const stylistId = req.user.userId; // From authMiddleware
    const { startDate, endDate } = req.query; // Expecting YYYY-MM-DD format

    try {
        // 1. Get weekly schedule (remains the same, as it's general)
        const { rows: weeklySchedules } = await db.query(
            'SELECT * FROM stylist_schedules WHERE stylist_id = $1 ORDER BY day_of_week, start_time',
            [stylistId]
        );

        // 2. Get appointments within the specified date range or a default range
        let appointmentsQuery = `
            SELECT
                a.appointment_id,
                a.appointment_start_time,
                a.appointment_end_time,
                a.status,
                a.notes, -- Ensure customer notes are fetched
                s.service_id,
                s.service_name,
                s.description as service_description,
                s.duration_minutes,
                s.price as service_price,
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
                a.stylist_id = $1
                AND a.status NOT IN ('cancelled') -- Maybe also exclude 'completed' depending on calendar needs
        `;

        const queryParams = [stylistId];

        if (startDate && endDate) {
            const rangeStart = new Date(startDate + "T00:00:00.000Z");
            const rangeEnd = new Date(endDate + "T23:59:59.999Z");

            if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
                return res.status(400).json({ message: 'Invalid startDate or endDate format. Use YYYY-MM-DD.' });
            }

            appointmentsQuery += ` AND a.appointment_start_time >= $${queryParams.length + 1} AND a.appointment_start_time <= $${queryParams.length + 2}`;
            queryParams.push(rangeStart.toISOString());
            queryParams.push(rangeEnd.toISOString());
        } else {
            const today = new Date();
            today.setUTCHours(0,0,0,0);
            const futureLimit = new Date(today);
            futureLimit.setDate(today.getDate() + 30);

            appointmentsQuery += ` AND a.appointment_start_time >= $${queryParams.length + 1} AND a.appointment_start_time <= $${queryParams.length + 2}`;
            queryParams.push(today.toISOString());
            queryParams.push(futureLimit.toISOString());
        }

        appointmentsQuery += ` ORDER BY a.appointment_start_time ASC;`;

        const { rows: appointmentData } = await db.query(appointmentsQuery, queryParams);

        const appointments = appointmentData.map(row => ({
            id: row.appointment_id,
            title: `${row.service_name} - ${row.customer_first_name} ${row.customer_last_name}`,
            start: new Date(row.appointment_start_time),
            end: new Date(row.appointment_end_time),
            allDay: false,
            status: row.status,
            resource: {
                notes: row.notes,
                service: {
                    id: row.service_id,
                    name: row.service_name,
                    description: row.service_description,
                    duration: row.duration_minutes,
                    price: row.service_price
                },
                customer: {
                    id: row.customer_id,
                    firstName: row.customer_first_name,
                    lastName: row.customer_last_name,
                    email: row.customer_email,
                    phone: row.customer_phone_number,
                    fullName: `${row.customer_first_name} ${row.customer_last_name}`
                }
            }
        }));

        res.status(200).json({
            weekly_schedule: weeklySchedules,
            appointments: appointments
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
        const service = await getServiceById(serviceId);
        if (!service) {
            return res.status(404).json({ message: 'Service not found.' });
        }
        const serviceDuration = service.duration_minutes;

        let targetStylistIds = [];
        if (preferredStylistId) {
            const { rows: stylistCheck } = await db.query('SELECT user_id FROM users WHERE user_id = $1 AND role_id = (SELECT role_id FROM user_roles WHERE role_name = $2)', [preferredStylistId, 'stylist']);
            if (stylistCheck.length === 0) {
                return res.status(404).json({ message: 'Preferred stylist not found or is not a stylist.' });
            }
            targetStylistIds.push(preferredStylistId);
        } else {
            const { rows: allStylists } = await db.query('SELECT user_id FROM users WHERE role_id = (SELECT role_id FROM user_roles WHERE role_name = $2)', ['stylist']);
            targetStylistIds = allStylists.map(s => s.user_id);
        }

        if (targetStylistIds.length === 0) {
            return res.status(404).json({ message: 'No stylists available.' });
        }

        const requestedDate = new Date(date);
        const dayOfWeek = requestedDate.getUTCDay();

        const availableSlotsByStylist = {};

        for (const stylistId of targetStylistIds) {
            const { rows: weeklySchedules } = await db.query(
                'SELECT start_time, end_time FROM stylist_schedules WHERE stylist_id = $1 AND day_of_week = $2 AND is_available = TRUE',
                [stylistId, dayOfWeek]
            );

            if (weeklySchedules.length === 0) continue;

            for (const schedule of weeklySchedules) {
                let stylistWorkStart = new Date(`${date}T${schedule.start_time}Z`);
                let stylistWorkEnd = new Date(`${date}T${schedule.end_time}Z`);

                const { rows: appointments } = await db.query(
                    `SELECT appointment_start_time, appointment_end_time FROM appointments
                     WHERE stylist_id = $1 AND appointment_start_time >= $2 AND appointment_start_time < $3
                     AND status != 'cancelled'`,
                    [stylistId, `${date}T00:00:00Z`, `${date}T23:59:59Z`]
                );

                const { rows: blockedSlots } = await db.query(
                    `SELECT start_time, end_time FROM blocked_time_slots
                     WHERE (stylist_id = $1 OR stylist_id IS NULL) AND start_time < $2 AND end_time > $3`,
                    [stylistId, new Date(`${date}T23:59:59Z`), new Date(`${date}T00:00:00Z`)]
                );

                const busyPeriods = [];
                appointments.forEach(app => busyPeriods.push({ start: new Date(app.appointment_start_time), end: new Date(app.appointment_end_time) }));
                blockedSlots.forEach(block => busyPeriods.push({ start: new Date(block.start_time), end: new Date(block.end_time) }));
                busyPeriods.sort((a, b) => a.start - b.start);

                let potentialSlotStart = new Date(stylistWorkStart);
                const slotsForStylist = [];

                while (potentialSlotStart < stylistWorkEnd) {
                    let potentialSlotEnd = new Date(potentialSlotStart.getTime() + serviceDuration * 60000);
                    if (potentialSlotEnd > stylistWorkEnd) break;

                    let isSlotAvailable = true;
                    for (const busyPeriod of busyPeriods) {
                        if (potentialSlotStart < busyPeriod.end && potentialSlotEnd > busyPeriod.start) {
                            isSlotAvailable = false;
                            break;
                        }
                    }
                    if (isSlotAvailable) {
                        slotsForStylist.push(potentialSlotStart.toISOString().substr(11, 5));
                    }
                    potentialSlotStart.setTime(potentialSlotStart.getTime() + 15 * 60000);
                }
                if(slotsForStylist.length > 0) {
                    if (!availableSlotsByStylist[stylistId]) availableSlotsByStylist[stylistId] = [];
                    availableSlotsByStylist[stylistId].push(...slotsForStylist);
                    availableSlotsByStylist[stylistId] = [...new Set(availableSlotsByStylist[stylistId])].sort();
                }
            }
        }
        if (Object.keys(availableSlotsByStylist).length === 0) {
            return res.status(200).json({ message: 'No available slots found for the selected criteria.', slots: [] });
        }

        if (preferredStylistId && availableSlotsByStylist[preferredStylistId]) {
             res.status(200).json({ stylistId: preferredStylistId, slots: availableSlotsByStylist[preferredStylistId] });
        } else if (preferredStylistId) {
             res.status(200).json({ message: 'No available slots found for the preferred stylist.', slots: [] });
        }
         else {
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
