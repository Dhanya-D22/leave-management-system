import { useEffect, useState } from "react";
import api from "../../services/api";
import Loading from "../../components/Loading";
import StatusBadge from "../../components/StatusBadge";

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get("/dashboard/admin");

        setData(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Admin Dashboard</h2>
          <p>Overview of organization's leave activity.</p>
        </div>

        <a
          href="/admin/requests"
          className="primary-button"
        >
          View Requests
        </a>
      </div>

      <div className="stats-grid admin-stats">
        <div className="stat-card">
          <div className="stat-icon purple" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="8" r="3.5" />
              <path d="M2.5 20v-1.5A4.5 4.5 0 0 1 7 14h4a4.5 4.5 0 0 1 4.5 4.5V20M16 4.8a3.5 3.5 0 0 1 0 6.4M17 14h.5a4 4 0 0 1 4 4v2" />
            </svg>
          </div>

          <div>
            <span>Total Employees</span>
            <h3>{data?.stats?.employees || 0}</h3>
            <small>Active employees</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
          </div>

          <div>
            <span>Pending</span>
            <h3>{data?.stats?.pending || 0}</h3>
            <small>Need your attention</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="m8 12 2.5 2.5L16.5 9" />
            </svg>
          </div>

          <div>
            <span>Approved</span>
            <h3>{data?.stats?.approved || 0}</h3>
            <small>Approved requests</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="m9 9 6 6m0-6-6 6" />
            </svg>
          </div>

          <div>
            <span>Rejected</span>
            <h3>{data?.stats?.rejected || 0}</h3>
            <small>Rejected requests</small>
          </div>
        </div>
      </div>

      <div className="content-card">
        <div className="card-header">
          <div>
            <h3>Recent Leave Requests</h3>
            <p>Latest employee leave applications</p>
          </div>

          <a href="/admin/requests">View all</a>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {(data?.recentRequests || []).map(
                (request) => (
                  <tr key={request.id}>
                    <td>
                      <strong>
                        {request.employee_name}
                      </strong>

                      <small className="table-subtext">
                        {request.employee_email}
                      </small>
                    </td>

                    <td>{request.leave_type}</td>

                    <td>
                      {new Date(
                        request.start_date
                      ).toLocaleDateString()}{" "}
                      -{" "}
                      {new Date(
                        request.end_date
                      ).toLocaleDateString()}
                    </td>

                    <td>{request.number_of_days}</td>

                    <td>
                      <StatusBadge
                        status={request.status}
                      />
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
