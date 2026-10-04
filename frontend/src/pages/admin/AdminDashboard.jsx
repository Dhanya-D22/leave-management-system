import { useEffect, useState } from "react";
import api from "../../services/api";
import Loading from "../../components/Loading";
import StatusBadge from "../../components/StatusBadge";

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

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

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Admin Dashboard</h2>
          <p>Overview of your organization's leave activity.</p>
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
          <div className="stat-icon purple">♙</div>

          <div>
            <span>Total Employees</span>
            <h3>{data?.stats?.employees || 0}</h3>
            <small>Active employees</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">◷</div>

          <div>
            <span>Pending</span>
            <h3>{data?.stats?.pending || 0}</h3>
            <small>Need your attention</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">✓</div>

          <div>
            <span>Approved</span>
            <h3>{data?.stats?.approved || 0}</h3>
            <small>Approved requests</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">×</div>

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