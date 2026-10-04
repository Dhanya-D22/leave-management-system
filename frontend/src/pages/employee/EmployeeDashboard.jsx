import { useEffect, useState } from "react";
import api from "../../services/api";
import Loading from "../../components/Loading";
import StatusBadge from "../../components/StatusBadge";

function EmployeeDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get("/dashboard/employee");
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

  const balances = data?.balances || [];
  const recentRequests = data?.recentRequests || [];

  const totalRemaining = balances.reduce(
    (sum, item) => sum + Number(item.remaining_days || 0),
    0
  );

  const pending = Number(data?.stats?.pending || 0);
  const approved = Number(data?.stats?.approved || 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Employee Dashboard</h2>
          <p>Overview of your leave activity.</p>
        </div>

        <a href="/apply-leave" className="primary-button">
          + Apply Leave
        </a>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple">◫</div>

          <div>
            <span>Total Remaining</span>
            <h3>{totalRemaining}</h3>
            <small>Days available</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">◷</div>

          <div>
            <span>Pending Requests</span>
            <h3>{pending}</h3>
            <small>Awaiting approval</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">✓</div>

          <div>
            <span>Approved</span>
            <h3>{approved}</h3>
            <small>Recent requests</small>
          </div>
        </div>
      </div>

      <div className="content-grid">
        <div className="content-card">
          <div className="card-header">
            <div>
              <h3>Leave Balance</h3>
              <p>Your available leave days</p>
            </div>

            <a href="/leave-balance">View all</a>
          </div>

          <div className="balance-list">
            {balances.map((balance) => {
              const percentage =
                balance.total_days > 0
                  ? (balance.remaining_days /
                      balance.total_days) *
                    100
                  : 0;

              return (
                <div
                  className="balance-item"
                  key={balance.leave_type_id}
                >
                  <div className="balance-top">
                    <span>{balance.name}</span>

                    <strong>
                      {balance.remaining_days}/
                      {balance.total_days}
                    </strong>
                  </div>

                  <div className="progress-bar">
                    <div
                      className="progress-value"
                      style={{
                        width: `${percentage}%`,
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="content-card">
          <div className="card-header">
            <div>
              <h3>Recent Requests</h3>
              <p>Your latest leave applications</p>
            </div>

            <a href="/leave-history">View all</a>
          </div>

          <div className="request-list">
            {recentRequests.length === 0 ? (
              <div className="empty-state">
                No leave requests yet.
              </div>
            ) : (
              recentRequests.map((request) => (
                <div
                  className="request-item"
                  key={request.id}
                >
                  <div className="request-date">
                    <strong>
                      {new Date(
                        request.start_date
                      ).getDate()}
                    </strong>

                    <span>
                      {new Date(
                        request.start_date
                      ).toLocaleString("en-US", {
                        month: "short",
                      })}
                    </span>
                  </div>

                  <div className="request-details">
                    <strong>{request.leave_type}</strong>

                    <span>
                      {request.number_of_days} day
                      {request.number_of_days > 1
                        ? "s"
                        : ""}
                    </span>
                  </div>

                  <StatusBadge
                    status={request.status}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeDashboard;
