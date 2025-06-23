# Hair Studio Web Reservation System

## Overview

This project is a web-based reservation system tailored for a hair studio. It allows customers to book appointments online, and provides interfaces for staff (stylists) and administrators to manage bookings, schedules, and services.

This repository contains both the frontend (React with Vite) and backend (Node.js with Express) applications.

## Project Structure

-   `/backend`: Contains the Node.js/Express backend application.
-   `/frontend`: Contains the React/Vite frontend application.
-   `/backend/schema.sql`: Defines the PostgreSQL database schema.

## Core Features Implemented (Initial Version)

*   **User Roles:** Customer, Stylist, Administrator.
*   **Authentication:** Secure registration and login for all roles (JWT-based).
*   **Service Management:**
    *   Admins can add services.
    *   Customers can view available services.
*   **Scheduling & Availability:**
    *   Admins can define weekly schedules for stylists.
    *   System calculates available appointment slots based on service duration, stylist schedules, existing bookings, and blocked times.
*   **Appointment Booking:**
    *   Customers can select a service, date, and an available time slot to book an appointment.
*   **Appointment Viewing:**
    *   Customers can view their upcoming appointments.
*   **Stylist Dashboard:**
    *   Stylists can log in to view their weekly schedule and upcoming appointments.
*   **Admin - Staff Management:**
    *   Admins can create new stylist accounts.

## Getting Started

Please refer to the README files within the `/backend` and `/frontend` directories for specific setup and running instructions for each part of the application.

1.  **Database Setup:** You will need a PostgreSQL database. Use the `backend/schema.sql` file to create the necessary tables and roles.
2.  **Backend Setup:** Configure environment variables (see `backend/README.md`) and install dependencies.
3.  **Frontend Setup:** Configure environment variables (see `frontend/README.md`) and install dependencies.

## Technology Stack (Current)

*   **Backend:** Node.js, Express.js, PostgreSQL
*   **Frontend:** React (with Vite), JavaScript
*   **Authentication:** JWT (JSON Web Tokens)

## Future Enhancements (Planned/Potential)

*   Detailed Admin Dashboard (managing all users, services, bookings, business settings).
*   Stylist ability to manage their own availability blocks.
*   Appointment cancellation/rescheduling.
*   Email/SMS notifications for bookings, reminders, etc.
*   Password reset functionality.
*   Payment integration.
*   And more as per the original project specification.
