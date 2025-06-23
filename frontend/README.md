# Hair Studio - Frontend

This directory contains the React (with Vite) frontend application for the Hair Studio Web Reservation System.

## Project Structure

-   `/public`: Contains static assets that are served directly.
-   `/src`: Contains the main React application code.
    -   `/assets`: Static assets like images, fonts (if any) used by components.
    -   `/components`: Reusable UI components (e.g., ServiceCard, Navigation).
    -   `/pages`: Top-level page components that correspond to different views/routes (e.g., HomePage, LoginPage, BookingPage).
    -   `/services`: Contains `api.js` for making requests to the backend API.
    -   `App.jsx`: The main application component, sets up routing.
    -   `main.jsx`: The entry point for the React application.
    -   `index.css`: Global styles (or entry point for other CSS files).
-   `.env` (example): File for environment variables (you need to create your own `.env` file if you want to override defaults).
-   `package.json`: Lists project dependencies and scripts.
-   `vite.config.js`: Configuration file for Vite.

## Setup Instructions

1.  **Navigate to the Frontend Directory:**
    Make sure you are in the `frontend` directory from the project root.

2.  **Install Dependencies:**
    Run the following command to install the necessary Node modules:
    ```bash
    npm install
    ```

3.  **Set Up Environment Variables (Optional but Recommended):**
    The frontend application needs to know the URL of the backend API. This is configured via an environment variable.
    Create a `.env` file in the `frontend` directory.
    *   `VITE_API_URL`: The base URL for the backend API.
        Example: `VITE_API_URL=http://localhost:3001/api`
        If this file or variable is not set, the application will default to `http://localhost:3001/api` as defined in `src/services/api.js`.

## Running the Development Server

Once dependencies are installed:

1.  **Start the Vite development server:**
    ```bash
    npm run dev
    ```
    This command will start the frontend development server, typically on a port like `http://localhost:5173` (Vite will indicate the actual port in the terminal). Open this URL in your web browser to see the application.

    The application uses Hot Module Replacement (HMR), so changes you make to the code should reflect in the browser almost instantly without a full page reload.

## Key Frontend Features

*   User Registration and Login forms.
*   Display of available hair services.
*   Appointment booking interface (service selection, date picking, slot selection).
*   Customer dashboard to view "My Appointments".
*   Stylist dashboard to view weekly schedule and upcoming appointments.
*   Admin dashboard for creating new stylist accounts.
*   Role-based navigation and route protection.
