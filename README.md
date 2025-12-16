# Course Management System

This is a [Next.js](https://nextjs.org) project for a course management system.

## Functionality by Role

This document outlines the implemented features for each user role in the course management system, based on the existing pages and logic.

### Admin

-   **Product Management:**
    -   View a list of all products.
    -   Add, edit, and delete products.

-   **Student & Schedule Management:**
    -   View a comprehensive schedule of all students.
    -   Filter schedules by teacher, class, or class type.
    -   Search for students by name, phone, or email.
    -   View and manage student attendance.
    -   View student progress and makeup credits.

-   **Dashboard & Analytics:**
    -   View summary statistics of students, teachers, and enrollments.
    -   See the number of pending leave and makeup requests.
    -   View recent activities like new enrollments and pending requests.
    -   Quickly navigate to other management pages.

### Teacher

-   **Dashboard & Overview:**
    -   View a summary of total classes, students, and today's classes.
    -   View a weekly schedule of their classes.
    -   See a detailed list of their own classes.

-   **Class Management:**
    -   Create new classes.
    -   Edit their existing classes.
    -   Cancel a scheduled class session.

-   **Student Progress Tracking:**
    -   View a summary of each student's progress.
    -   Track student attendance (present, absent, excused, makeup).
    -   Monitor course completion status for each student.

### Student

-   **Schedule & Enrollment:**
    -   View their personal weekly class schedule.
    -   See a summary of their course enrollments, including progress and remaining sessions.
    -   Track their available makeup credits.

-   **Leave & Makeup Requests:**
    -   Submit a request to be absent from a class.
    -   Cancel a pending leave request.
    -   Book a makeup session for a missed class from a list of available slots.
    -   Cancel a scheduled makeup session.

-   **Course Discovery:**
    -   View prompts and links to register for new courses.

---

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

-   [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
-   [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
