-- User Roles Table: Defines the roles available in the system
CREATE TABLE user_roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL -- e.g., 'customer', 'stylist', 'admin'
);

-- Users Table: Stores information about all users
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES user_roles(role_id)
);

-- Services Table: Stores details about the services offered
CREATE TABLE services (
    service_id SERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL, -- Duration of the service in minutes
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stylist Schedules Table: Defines the general working hours for stylists
-- This table can be expanded to be more granular if needed (e.g., specific days of the week)
CREATE TABLE stylist_schedules (
    schedule_id SERIAL PRIMARY KEY,
    stylist_id INT NOT NULL,
    -- Day of the week: 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL, -- e.g., '09:00:00'
    end_time TIME NOT NULL,   -- e.g., '17:00:00'
    is_available BOOLEAN DEFAULT TRUE,
    UNIQUE (stylist_id, day_of_week, start_time, end_time), -- Ensure no overlapping general schedules for the same stylist
    FOREIGN KEY (stylist_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Appointments Table: Stores information about booked appointments
CREATE TABLE appointments (
    appointment_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL,
    stylist_id INT NOT NULL,
    service_id INT NOT NULL,
    appointment_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    appointment_end_time TIMESTAMP WITH TIME ZONE NOT NULL, -- Calculated based on service duration
    status VARCHAR(50) DEFAULT 'booked', -- e.g., 'booked', 'completed', 'cancelled', 'no-show'
    notes TEXT, -- Customer notes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (stylist_id) REFERENCES users(user_id) ON DELETE CASCADE, -- Stylist is also a user
    FOREIGN KEY (service_id) REFERENCES services(service_id)
);

-- Blocked Time Slots Table: For stylists/admins to block out specific times
CREATE TABLE blocked_time_slots (
    block_id SERIAL PRIMARY KEY,
    stylist_id INT, -- Can be NULL if the block applies to the whole studio
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    reason VARCHAR(255), -- e.g., 'Lunch Break', 'Holiday', 'Personal Time'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stylist_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Pre-populate user_roles
INSERT INTO user_roles (role_name) VALUES ('customer'), ('stylist'), ('admin');

-- Create indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX idx_appointments_stylist_id ON appointments(stylist_id);
CREATE INDEX idx_appointments_start_time ON appointments(appointment_start_time);
CREATE INDEX idx_stylist_schedules_stylist_id ON stylist_schedules(stylist_id);
CREATE INDEX idx_blocked_time_slots_stylist_id ON blocked_time_slots(stylist_id);
CREATE INDEX idx_blocked_time_slots_start_end_time ON blocked_time_slots(start_time, end_time);

-- Password Reset Tokens Table
CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE, -- Store a hash of the reset token
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
