import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import ApplyLeave from "./pages/employee/ApplyLeave";
import LeaveHistory from "./pages/employee/LeaveHistory";
import LeaveBalance from "./pages/employee/LeaveBalance";

import AdminDashboard from "./pages/admin/AdminDashboard";
import LeaveRequests from "./pages/admin/LeaveRequests";
import Employees from "./pages/admin/Employees";
import LeaveTypes from "./pages/admin/LeaveTypes";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
                <Layout>
                  <EmployeeDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/apply-leave"
            element={
              <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
                <Layout>
                  <ApplyLeave />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/leave-history"
            element={
              <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
                <Layout>
                  <LeaveHistory />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/leave-balance"
            element={
              <ProtectedRoute allowedRoles={["EMPLOYEE"]}>
                <Layout>
                  <LeaveBalance />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/requests"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <Layout>
                  <LeaveRequests />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/employees"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <Layout>
                  <Employees />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/leave-types"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <Layout>
                  <LeaveTypes />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/"
            element={<Navigate to="/login" replace />}
          />

          <Route
            path="*"
            element={<Navigate to="/login" replace />}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
