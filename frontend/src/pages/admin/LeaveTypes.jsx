import { useEffect, useState } from "react";
import api from "../../services/api";
import Loading from "../../components/Loading";

const emptyForm = { name: "", total_days: "", description: "" };

function LeaveTypes() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchLeaveTypes = async () => {
    try {
      const response = await api.get("/leave-types");
      setLeaveTypes(response.data.leaveTypes || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load leave types.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  };

  const startEdit = (leaveType) => {
    setError("");
    setMessage("");
    setEditingId(leaveType.id);
    setForm({
      name: leaveType.name,
      total_days: String(leaveType.total_days),
      description: leaveType.description || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      if (editingId) {
        await api.put(`/leave-types/${editingId}`, {
          ...form,
          total_days: Number(form.total_days),
        });
        setMessage("Leave type updated. Employee balances have been adjusted.");
      } else {
        await api.post("/leave-types", {
          ...form,
          total_days: Number(form.total_days),
        });
        setMessage("Leave type created and added to employee balances.");
      }
      closeForm();
      await fetchLeaveTypes();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save this leave type.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (leaveType) => {
    setError("");
    setMessage("");
    try {
      await api.patch(`/leave-types/${leaveType.id}/active`, {
        is_active: !leaveType.is_active,
      });
      setMessage(
        leaveType.is_active
          ? `${leaveType.name} is now inactive and hidden from employee applications.`
          : `${leaveType.name} is active and available to employees.`
      );
      await fetchLeaveTypes();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to change leave type status.");
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Leave Types</h2>
          <p>Set the leave options and annual days available to employees.</p>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setMessage("");
            setError("");
            setEditingId(null);
            setForm(emptyForm);
            setShowForm((visible) => !visible);
          }}
        >
          {showForm && !editingId ? "Close" : "Add Leave Type"}
        </button>
      </div>

      {message && <div className="success-message" role="status">{message}</div>}
      {error && !showForm && <div className="error-message" role="alert">{error}</div>}

      {showForm && (
        <form className="employee-form-card leave-type-form" onSubmit={handleSubmit}>
          <h3>{editingId ? "Edit Leave Type" : "Add Leave Type"}</h3>
          {error && <div className="error-message" role="alert">{error}</div>}
          <div className="employee-form-fields">
            <div className="form-group">
              <label htmlFor="leave-type-name">Leave type name</label>
              <input
                id="leave-type-name"
                value={form.name}
                maxLength={80}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="e.g. Work From Home"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="leave-type-days">Annual allowed days</label>
              <input
                id="leave-type-days"
                type="number"
                min="1"
                max="3650"
                step="1"
                value={form.total_days}
                onChange={(event) => setForm({ ...form, total_days: event.target.value })}
                placeholder="e.g. 12"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="leave-type-description">Description</label>
              <input
                id="leave-type-description"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Optional details"
              />
            </div>
          </div>
          <div className="leave-type-form-actions">
            <button type="button" className="secondary-button" onClick={closeForm}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save Changes" : "Create Leave Type"}
            </button>
          </div>
        </form>
      )}

      <div className="table-card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>Annual Days</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaveTypes.length === 0 ? (
                <tr><td colSpan="5"><div className="empty-state">No leave types configured.</div></td></tr>
              ) : leaveTypes.map((leaveType) => (
                <tr key={leaveType.id}>
                  <td><strong>{leaveType.name}</strong></td>
                  <td>{leaveType.total_days} days</td>
                  <td>{leaveType.description || "—"}</td>
                  <td>
                    <span className={`leave-type-status ${leaveType.is_active ? "is-active" : "is-inactive"}`}>
                      {leaveType.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="leave-type-actions">
                      <button type="button" className="secondary-button" onClick={() => startEdit(leaveType)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="leave-type-toggle"
                        onClick={() => toggleActive(leaveType)}
                      >
                        {leaveType.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default LeaveTypes;
