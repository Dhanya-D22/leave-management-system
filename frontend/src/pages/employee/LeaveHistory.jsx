import { useEffect, useState } from "react";
import api from "../../services/api";
import Loading from "../../components/Loading";
import StatusBadge from "../../components/StatusBadge";

function LeaveHistory() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get("/leaves/my");

      setRequests(response.data.requests || []);
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
          <h2>Leave History</h2>
          <p>View all your leave requests.</p>
        </div>

        <a href="/apply-leave" className="primary-button">
          + Apply Leave
        </a>
      </div>

      <div className="table-card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="empty-state">
                      No leave requests found.
                    </div>
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <strong>
                        {request.leave_type}
                      </strong>
                    </td>

                    <td>
                      {new Date(
                        request.start_date
                      ).toLocaleDateString()}
                    </td>

                    <td>
                      {new Date(
                        request.end_date
                      ).toLocaleDateString()}
                    </td>

                    <td>
                      {request.number_of_days}
                    </td>

                    <td className="reason-cell">
                      {request.reason}
                    </td>

                    <td>
                      <StatusBadge
                        status={request.status}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default LeaveHistory;