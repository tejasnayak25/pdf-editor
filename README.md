# PDF Editor

## Overview
This project is a PDF editor that allows users to upload, edit, and manage PDF documents efficiently.

## Features
- Upload PDF files
- Add text, radio, checkbox, dropdown and canvas inputs.
- Edit existing inputs
- Delete inputs
- View PDF submissions
- Save and download edited PDFs
- User authentication for secure access

## Technologies Used
- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express
- PDF Manipulation: pdf-lib, react-pdf

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/pdf-editor.git
   ```
2. Navigate to the project directory:
   ```bash
   cd pdf-editor
   ```
3. Install dependencies for both backend and frontend:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

## Running the Application
- Start the backend server:
   ```bash
   cd backend
   node index.js
   ```
- Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

## User Roles
- Teacher: Can upload and edit PDFs, manage inputs, view submissions and export PDFs.
- Student: Can view and fill out PDF forms, save drafts, submit completed PDFs and export PDFs.

## Q&A
**Q: How would you handle persisting edits per user (versioning optional but nice)?**
A: Each time a user makes edits to a PDF, they can save it as a draft and retrieve it later. Each draft is associated with the user's email and the PDF ID in the database. When the user submits the final version, it is saved as a completed submission.

**Q: How would you handle exporting a final PDF (flattened)?**
A: Each input field has its position and dimensions stored relative to the PDF page. When exporting, we use a PDF manipulation library (like pdf-lib) to load the original PDF, iterate over each input field, and draw the corresponding values directly onto the PDF at the specified positions. Finally, we save the modified PDF as a new file for download.

**Q: How would you handle reopening a saved draft (not just final export)?**
A: When a user reopens a saved draft, we fetch the draft data from the database using the user's email and the Draft ID. We then load the original PDF and overlay the input fields with their saved values onto the PDF viewer. This allows the user to see their previous edits and continue working from where they left off.

**Q: How would you handle security basics (file validation, access control)?**
A: File validation is performed during the upload process to ensure that only valid PDF files are accepted. This includes checking the file type. Access control is implemented through user authentication and role-based permissions. Only authenticated users can access the application, and specific actions (like uploading or editing PDFs) are restricted based on the user's role (teacher or student).