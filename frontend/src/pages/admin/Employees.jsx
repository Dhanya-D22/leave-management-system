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

      <div className="employee-grid">
        {employees.length === 0 ? (
          <div className="empty-state">
            No employees found.
          </div>
        ) : (
          employees.map((employee) => (
            <div
              className="employee-card"
              key={employee.id}
            >
              <div className="employee-avatar">
                {employee.name
                  ?.charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <h3>{employee.name}</h3>

                <p>{employee.email}</p>

                <span className="employee-role">
                  Employee
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Employees;