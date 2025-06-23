# Hair Studio - Backend

This directory contains the Node.js/Express backend application for the Hair Studio Web Reservation System.

## Project Structure

-   `/controllers`: Contains controller functions that handle business logic for API requests.
-   `/middleware`: Contains middleware functions (e.g., for authentication, authorization).
-   `/routes`: Defines the API routes and maps them to controller functions.
-   `db.js`: Utility for connecting to the PostgreSQL database.
-   `server.js`: The main entry point for the Express server.
-   `schema.sql`: SQL script for database schema setup (located in this directory for reference, but should be run against your DB instance).
-   `.env` (example): File for environment variables (you need to create your own `.env` file).
-   `package.json`: Lists project dependencies and scripts.

## Setup Instructions

1.  **Install Dependencies:**
    Navigate to the `backend` directory and run:
    ```bash
    npm install
    ```

2.  **Set Up Environment Variables:**
    Create a `.env` file in the `backend` directory. Copy the contents from `.env.example` (if provided, otherwise create from scratch) and update the values for your environment.
    Key variables:
    *   `DATABASE_URL`: Connection string for your PostgreSQL database.
        Example: `DATABASE_URL=postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@YOUR_DB_HOST:YOUR_DB_PORT/YOUR_DB_NAME`
    *   `JWT_SECRET`: A strong, unique secret key for signing JSON Web Tokens.
        Example: `JWT_SECRET=yourSuperStrongAndSecretKeyGoesHere`
    *   `PORT`: The port on which the backend server will run (defaults to 3001 if not set).
        Example: `PORT=3001`

3.  **Database Setup:**
    *   Ensure you have a PostgreSQL database server running.
    *   Create a database for this project.
    *   Use the `schema.sql` file (also in this directory) to create the necessary tables and pre-populate the `user_roles` table. You can run this script using a PostgreSQL client like `psql` or a GUI tool.
    *   Make sure the `DATABASE_URL` in your `.env` file points to this database with correct credentials.

## Running the Server

Once dependencies are installed and the `.env` file is configured:

1.  **Start the server:**
    ```bash
    npm start
    ```
    This typically runs `node server.js`. The server should start, and you'll see a message indicating it's running on the configured port (e.g., `Server is running on port 3001`).

## API Endpoints Overview

The backend provides API endpoints for:
*   User Authentication (`/api/auth`): Registration, Login.
*   Service Management (`/api/services`): Adding (admin) and listing services.
*   Scheduling & Availability (`/api/schedules`): Setting stylist schedules, getting availability, stylist viewing their own schedule.
*   Appointment Booking (`/api/appointments`): Creating appointments, customers viewing their appointments.
*   Admin Functions (`/api/admin`): Creating stylist accounts.

Refer to the route files in `/routes` and controller files in `/controllers` for detailed endpoint definitions and logic.
