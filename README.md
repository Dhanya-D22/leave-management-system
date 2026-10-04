# Leave Management System

A full-stack Leave Management System that allows employees to apply for leave, track leave requests and balances, while administrators can manage employees, review leave requests, approve/reject applications, and monitor leave statistics.

## Live Application

- Frontend: [Add Vercel URL after deployment]
- Backend API: [Add Render/Railway backend URL after deployment]
- GitHub Repository: [Add GitHub repository URL]

---

## 1. Project Overview

The Leave Management System is a web-based application developed to simplify employee leave management.

The system provides two main roles:

### Employee

- Login securely
- View leave balance
- Apply for leave
- View leave history
- Track leave request status
- View available leave types

### Administrator

- Login securely
- View dashboard statistics
- Manage employees
- View all leave requests
- Approve or reject leave requests
- Monitor employee leave information

The application uses a React frontend, Node.js/Express backend and PostgreSQL database.

---

## 2. Features

### Authentication

- Employee and administrator login
- JWT-based authentication
- Password hashing using bcrypt
- Role-based access control
- Protected routes

### Employee Features

- Employee dashboard
- Apply for leave
- Select leave type
- Enter start and end dates
- Provide leave reason
- View leave history
- View leave status
- View leave balance

### Admin Features

- Admin dashboard
- View total employees
- View pending leave requests
- View approved and rejected requests
- Manage employees
- Add employees
- View employee information
- Approve/reject leave requests

### Leave Management

- Multiple leave types
- Leave balance tracking
- Pending/Approved/Rejected status
- Automatic balance update after approval
- Leave request history

### Security

- JWT authentication
- Password hashing
- Protected API routes
- Role-based authorization
- Environment variables for sensitive configuration

### User Interface

- Responsive design
- Mobile-friendly layout
- Employee and admin dashboards
- Clean and professional interface

---

## 3. System Architecture

The application follows a three-tier architecture:

```text
┌─────────────────────────┐
│       Frontend          │
│     React + Vite        │
│                         │
│ Employee / Admin UI     │
└────────────┬────────────┘
             │
             │ REST API
             ▼
┌─────────────────────────┐
│        Backend          │
│    Node.js + Express    │
│                         │
│ Authentication          │
│ Leave Management        │
│ Employee Management     │
│ Dashboard APIs          │
└────────────┬────────────┘
             │
             │ PostgreSQL
             ▼
┌─────────────────────────┐
│       Database          │
│       PostgreSQL        │
│                         │
│ users                   │
│ leave_types             │
│ leave_requests          │
│ leave_balances          │
└─────────────────────────┘
```
