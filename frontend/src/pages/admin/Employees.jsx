import { useEffect, useState } from "react";
import api, { createEmployee } from "../../services/api";
import Loading from "../../components/Loading";

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const fetchEmployees = async () => {
    try {
      const response = await api.get("/employees");

      setEmployees(response.data.employees || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isCurrent = true;

    api
      .get("/employees")
      .then((response) => {
        if (isCurrent) {
          setEmployees(response.data.employees || []);
        }
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        if (isCurrent) {
          setLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");
    setCreating(true);

    try {
      const response = await createEmployee(formData);
      setSuccessMessage(
        `${response.data.employee.name} was created. They can sign in using ${response.data.employee.email} and the password you set.`
      );
      setFormData({ name: "", email: "", password: "" });
      setShowForm(false);
      await fetchEmployees();
    } catch (error) {
      setFormError(
        error.response?.data?.message ||
          "Unable to create employee. Please try again."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (employee) => {
    const confirmed = window.confirm(
      `Delete ${employee.name} (${employee.email})? This will also delete their leave balances and leave requests. This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setDeleteError("");
    setSuccessMessage("");
    setDeletingId(employee.id);

    try {
      await api.delete(`/employees/${employee.id}`);
      setEmployees((currentEmployees) =>
        currentEmployees.filter((item) => item.id !== employee.id)
      );
      setSuccessMessage(`${employee.name} was deleted.`);
    } catch (error) {
      setDeleteError(
        error.response?.data?.message ||
          "Unable to delete employee. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Employees</h2>
          <p>View and manage employees in the organization.</p>
        </div>
        <button
          className="primary-button"
          type="button"
          onClick={() => {
            setFormError("");
            setSuccessMessage("");
            setShowForm((visible) => !visible);
          }}
        >
          {showForm ? "Cancel" : "Add Employee"}
        </button>
      </div>

      {successMessage && (
        <div className="success-message" role="status">
          {successMessage}
        </div>
      )}
      {deleteError && (
        <div className="error-message" role="alert">
          {deleteError}
        </div>
      )}

      {showForm && (
        <form className="employee-form-card" onSubmit={handleSubmit}>
          <h3>Add Employee</h3>
          {formError && (
            <div className="error-message" role="alert">
              {formError}
            </div>
          )}
          <div className="employee-form-fields">
            <div className="form-group">
              <label htmlFor="employee-name">Name</label>
              <input
                id="employee-name"
                name="name"
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={(event) =>
                  setFormData({ ...formData, name: event.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="employee-email">Email</label>
              <input
                id="employee-email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={(event) =>
                  setFormData({ ...formData, email: event.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="employee-password">Password</label>
              <input
                id="employee-password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={formData.password}
                onChange={(event) =>
                  setFormData({ ...formData, password: event.target.value })
                }
                required
              />
              <small>Must be at least 8 characters.</small>
            </div>
          </div>
          <button
            className="primary-button"
            type="submit"
            disabled={creating}
          >
            {creating ? "Creating..." : "Create Employee"}
          </button>
        </form>
      )}

      <div className="table-card">
        <div className="table-responsive">
          <table className="employee-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Added</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
        {employees.length === 0 ? (
          <tr>
            <td className="empty-state-cell" colSpan="4">
              No employees found.
            </td>
          </tr>
        ) : (
          employees.map((employee) => (
            <tr key={employee.id}>
              <td>
                <strong>{employee.name}</strong>
              </td>
              <td>{employee.email}</td>
              <td>
                {employee.created_at
                  ? new Date(employee.created_at).toLocaleDateString()
                  : "—"}
              </td>
              <td>
                <button
                  className="employee-delete-button"
                  type="button"
                  onClick={() => handleDelete(employee)}
                  disabled={deletingId === employee.id}
                  aria-label={`Delete ${employee.name}`}
                >
                  {deletingId === employee.id ? "Deleting..." : "Delete"}
                </button>
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

export default Employees;