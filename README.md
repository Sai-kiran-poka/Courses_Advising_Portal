<<<<<<< HEAD
# Course Advising Portal

## Overview

The Course Advising Portal is a web application designed to assist students in selecting courses based on their academic needs and preferences. The portal is built using modern web technologies, including **React**, **JavaScript**, and **Node.js**. The application is structured on the **Express** framework to ensure scalability and ease of development.

### Features
The portal includes the following features (this is a preliminary list and will be updated as the project progresses):

- **Search Functionality:** Allows users to search for courses using a search box.
- **User Authentication:** Advanced search features available post-login.
- **Course Recommendations:** Personalized course suggestions based on user data.

### Technology Stack
- **Frontend:** React
- **Backend:** Node.js with Express
- **Database:** MySQL

## Milestone Accomplishments

This section lists the project milestones and their completion status:

| Fulfilled | Feature# | Specification Description                                                                                                                                       |
|-----------|----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Yes       | 1        | Users should be able to register new accounts using email addresses.                                                                                            |
| Yes       | 2        | Users are identified by email address.                                                                                                                          |
| Yes       | 3        | Password must be encrypted before storing in the database.                                                                                                      |
| Yes       | 4        | Users cannot register duplicate accounts using the same email address.                                                                                          |
| Yes       | 5        | An admin user should be created from the backend (Only 1).                                                                                                       |
| Yes       | 6        | Users cannot log in to the system until their requests are approved by the admin.                                                                                |
| Yes       | 7        | An admin user has a different view from a regular user and can approve users.                                                                                    |
| Yes       | 8        | Users should be able to log into the website using the accounts they registered.                                                                                 |
| Yes       | 9        | Users should be able to reset their passwords if they forget them.                                                                                               |
| Yes       | 10       | Users should be able to change their passwords after login.                                                                                                      |
| Yes       | 11       | Implement a 2-factor-authentication for login, using email, phone text, or DUO push.                                                                             |
| Yes       | 12       | The website should have a homepage for each user, where they can view their profiles, change passwords, and update information (email cannot be changed).         |
| Yes       | 13       | Implement reCAPTCHA on the login page for enhanced security.                                                                                                     |
| Yes       | 14       | Validate the reCAPTCHA before permitting login attempts.                                                                                                         |
| Yes       | 15       | Prevent your application from clickjacking attacks by implementing prevention measures.                                                                          |
| Yes       | 16       | Add a favicon to the website.                                                                                                                                    |
| Yes       | 17       | Add password validation requiring uppercase, lowercase, number, and special character using regex in all password fields.                                        |
| Yes       | 18       | Design and create the prerequisite form allowing admin to set prerequisites for courses.                                                                          |
| Yes       | 19       | Update the database with changes made to the course prerequisites by the admin.                                                                                  |
| Yes       | 20       | Implement a course advising page displaying previous and pending advising records for students.                                                                  |
| Yes       | 21       | Students should be able to dynamically add rows to specify prerequisites and plan courses.                                                                        |
| Yes       | 22       | Implement rules for course selection to prevent students from adding courses they have already taken.                                                            |
| Yes       | 23       | Admin should have a screen to view and manage all advising sheets submitted by students, with options to approve or reject.                                       |
| Yes       | 24       | Notify students via email of any updates to their advising sheet status.                                                                                         |

## Architecture

The Course Advising Portal is architecturally designed to separate concerns between the client and server-side code:

- **Frontend:** Developed using React, ensuring a dynamic and responsive user interface.
- **Backend:** Node.js, utilizing Express for routing and handling API requests.
- **Database:** MySQL, where all course data and user information are stored.

### Architecture Diagram
![Architecture Diagram]("C:\Project 518\Course_project\Course_project\architecture_diagram.png.png") *(Ensure to replace the path with the actual image path)*

## Implementation

Each feature of the Course Advising Portal is implemented with careful consideration of scalability and maintainability:

1. **Search Functionality**  
   - **Location:** `Resources->views->pages->index.js`
   - **Details:** The search box is located on the landing page. Users can input keywords, which will then redirect them to the Search Results Page (SERP). The SERP includes a summary of results, with options to download course details. Advanced search options are available after login.

2. **User Authentication**  
   - **Location:** `Resources->controllers->auth.js`
   - **Details:** The user authentication process is implemented to secure access to certain features. The portal supports registration, login, and session management.

3. **Course Recommendations**  
   - **Location:** `Resources->views->components->recommendations.js`
   - **Details:** The recommendation engine analyzes user data and course information to suggest the most suitable courses for the student.

*Additional feature details will be added as they are implemented.*

## Setup

To set up the Course Advising Portal locally, follow these steps:

1. Install XAMPP:
   - First, install XAMPP and start the Apache and MySQL modules.

2. Navigate to the frontend directory:
   ```bash
   cd frontend
   npm start
   cd backend
npm start
=======
# Courses_Advising_Portal
Course Advising Portal: A web-based platform for student course planning and advising.
>>>>>>> 65b9222f06e38370db75c27a4cebe29a09ade327
