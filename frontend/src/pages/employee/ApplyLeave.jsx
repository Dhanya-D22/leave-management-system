import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

function ApplyLeave() {
  const navigate = useNavigate();

  const [leaveTypes, setLeaveTypes] = useState([]);

  const [form, setForm] = useState({
    leave_type_id: "",
    start_date: "",
    end_date: "",
    reason: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedLeaveType = leaveTypes.find(
    (type) => String(type.id) === String(form.leave_type_id)
  );

  useEffect(() => {
    let isCurrent = true;
    const params = {};
    if (form.start_date && form.end_date) {
      params.start_date = form.start_date;
      params.end_date = form.end_date;
    }

    api
      .get("/leaves/types", { params })
      .then((response) => {
        if (isCurrent) {
          const types = response.data?.leaveTypes;
          setLeaveTypes(Array.isArray(types) ? types : []);
        }
      })
      .catch((requestError) => {
        console.error(requestError);
        if (isCurrent) {
          setError("Unable to load leave types. Please refresh and try again.");
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [form.start_date, form.end_date]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const calculateDays = () => {
    if (!form.start_date || !form.end_date) {
      return 0;
    }

    // Parse date-only values in local time to avoid UTC date shifts.
    const [startYear, startMonth, startDay] = form.start_date
      .split("-")
      .map(Number);
    const [endYear, endMonth, endDay] = form.end_date
      .split("-")
      .map(Number);
    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);

    if (end.getTime() < start.getTime()) {
      return 0;
    }

    const difference = Math.round(
      (Date.UTC(endYear, endMonth - 1, endDay) -
        Date.UTC(startYear, startMonth - 1, startDay)) /
        (1000 * 60 * 60 * 24)
    );

    return difference + 1;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (
      !form.leave_type_id ||
      !form.start_date ||
      !form.end_date ||
      !form.reason.trim()
    ) {
      setError("Please fill all fields.");
      return;
    }

    if (calculateDays() <= 0) {
      setError("End date cannot be before start date.");
      return;
    }

    if (
      selectedLeaveType &&
      calculateDays() > Number(selectedLeaveType.remaining_days)
    ) {
      setError(
        `Only ${selectedLeaveType.remaining_days} day(s) are available for ${selectedLeaveType.name}.`
      );
      return;
    }

    try {
      setLoading(true);

      await api.post("/leaves", form);

      setMessage(
        "Leave application submitted successfully."
      );

      setForm({
        leave_type_id: "",
        start_date: "",
        end_date: "",
        reason: "",
      });
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to submit leave application."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Apply for Leave</h2>
          <p>Submit a new leave request.</p>
        </div>
      </div>

      <div className="form-card">
        {message && (
          <div className="success-message">
            ✓ {message}
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Leave Type *</label>

              <select
                name="leave_type_id"
                value={form.leave_type_id}
                onChange={handleChange}
              >
                <option value="">
                  Select leave type
                </option>

                {leaveTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} ({type.remaining_days} available)
                  </option>
                ))}
              </select>
              {selectedLeaveType && (
                <small className="leave-type-availability">
                  {selectedLeaveType.remaining_days} days available for {selectedLeaveType.balance_period_label} from the {selectedLeaveType.total_days}-day allocation. Pending applications do not deduct days; the balance updates after approval.
                </small>
              )}
            </div>

            <div className="form-group">
              <label>Number of Days</label>

              <div className="days-display" aria-live="polite">
                {calculateDays() > 0
                  ? `${calculateDays()} ${calculateDays() === 1 ? "day" : "days"}`
                  : "Select dates to calculate"}
              </div>
            </div>

            <div className="form-group">
              <label>Start Date *</label>

              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>End Date *</label>

              <input
                type="date"
                name="end_date"
                value={form.end_date}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Reason *</label>

            <textarea
              name="reason"
              rows="6"
              placeholder="Enter the reason for your leave..."
              value={form.reason}
              onChange={handleChange}
            ></textarea>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => navigate("/dashboard")}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading
                ? "Submitting..."
                : "Submit Leave Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ApplyLeave;
