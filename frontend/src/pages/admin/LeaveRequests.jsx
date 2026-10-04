import { useEffect, useState } from "react";
import api from "../../services/api";
import Loading from "../../components/Loading";
import StatusBadge from "../../components/StatusBadge";

function LeaveRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await api.get("/leaves/all");

      setRequests(response.data.requests || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    const confirmMessage =
      status === "APPROVED"
        ? "Approve this leave request?"
        : "Reject this leave request?";

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setProcessingId(id);

      await api.put(`/leaves/${id}/status`, {
        status,
      });

      await fetchRequests();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Unable to update request."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests =
    filter === "ALL"
      ? requests
      : requests.filter(
          (request) => request.status === filter
        );

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Leave Requests</h2>
          <p>Review and manage employee leave requests.</p>
        </div>
      </div>

      <div className="filter-tabs">
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map(
          (status) => (
            <button
              key={status}
              className={
                filter === status ? "filter-active" : ""
              }
              onClick={() => setFilter(status)}
            >
              {status}
            </button>
          )
        )}
      </div>

      <div className="table-card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="empty-state">
                      No requests found.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => (
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
                      ).toLocaleDateString()}
                      <br />
                      <small>
                        to{" "}
                        {new Date(
                          request.end_date
                        ).toLocaleDateString()}
                      </small>
                    </td>

                    <td>{request.number_of_days}</td>

                    <td className="reason-cell">
                      {request.reason}
                    </td>

                    <td>
                      <StatusBadge
                        status={request.status}
                      />
                    </td>

                    <td>
                      {request.status === "PENDING" ? (
                        <div className="action-buttons">
                          <button
                            className="approve-button"
                            disabled={
                              processingId === request.id
                            }
                            onClick={() =>
                              updateStatus(
                                request.id,
                                "APPROVED"
                              )
                            }
                          >
                            ✓
                          </button>

                          <button
                            className="reject-button"
                            disabled={
                              processingId === request.id
                            }
                            onClick={() =>
                              updateStatus(
                                request.id,
                                "REJECTED"
                              )
                            }
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <span className="no-action">
                          —
                        </span>
                      )}
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

export default LeaveRequests;