# EduNotes Project

EduNotes is a web application designed to manage video transcripts, notes, and user authentication. This project allows users to fetch transcripts from YouTube videos, manage their notes, and authenticate their accounts.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Controllers](#controllers)
- [Models](#models)
- [Services](#services)
- [Routes](#routes)
- [Environment Variables](#environment-variables)

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd EduNotes
   ```
3. Install the dependencies:
   ```
   npm install
   ```
4. Create a `.env` file in the root directory and add your environment variables.

## Usage

To start the application, run:
```
npm start
```
The application will be available at `http://localhost:3000`.

## Controllers

- **authController.mjs**: Handles user authentication, including login and registration.
- **notesController.mjs**: Manages notes, allowing users to create, update, and delete notes.
- **transcriptController.mjs**: Fetches and manages video transcripts, providing endpoints for retrieving transcripts and video details.

## Models

- **videoModel.js**: Defines the schema for video documents in the database and includes methods for interacting with video data.

## Services

- **transcriptService.js**: Provides utility functions for fetching transcripts from YouTube and validating URLs.

## Routes

- **transcriptRoutes.js**: Sets up the routes for transcript-related endpoints and associates them with the corresponding controller functions.

## Environment Variables

The project uses environment variables for configuration. Ensure to set the following in your `.env` file:

- `DATABASE_URL`: Connection string for the database.
- `YOUTUBE_API_KEY`: API key for accessing YouTube services.

## License

This project is licensed under the MIT License.