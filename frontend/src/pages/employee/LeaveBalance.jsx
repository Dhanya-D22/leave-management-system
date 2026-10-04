import { useEffect, useState } from "react";
import api from "../../services/api";
import Loading from "../../components/Loading";

function LeaveBalance() {
  const [balances, setBalances] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await api.get("/leaves/balance");

      setBalances(response.data.balances || []);
      setHistory(response.data.history || []);
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
          <h2>Leave Balance</h2>
          <p>Track your available leave days.</p>
        </div>
      </div>

      <div className="balance-card-grid">
        {balances.map((balance) => {
          const used =
            Number(balance.used_days) || 0;

          const total =
            Number(balance.total_days) || 0;

          const remaining =
            Number(balance.remaining_days) || 0;

          const usedPercentage =
            total > 0 ? (used / total) * 100 : 0;
          const periodLabel = balance.period_month
            ? new Date(
                Number(balance.period_year),
                Number(balance.period_month) - 1,
                1
              ).toLocaleDateString(undefined, { month: "long", year: "numeric" })
            : `${balance.period_year} yearly balance`;

          return (
            <div className="leave-balance-card" key={balance.id}>
              <div className="balance-card-icon">
                ◫
              </div>

              <h3>{balance.name}</h3>

              <p className="balance-description">
                {periodLabel} · resets {balance.reset_period === "MONTHLY" ? "monthly" : "yearly"}
              </p>

              <div className="large-balance">
                {remaining}

                <span>days remaining</span>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-value"
                  style={{
                    width: `${usedPercentage}%`,
                  }}
                ></div>
              </div>

              <div className="balance-footer">
                <span>
                  Used: <strong>{used}</strong>
                </span>

                <span>
                  Total: <strong>{total}</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {history.length > 0 && (
        <div className="content-card balance-history-card">
          <div className="card-header">
            <div>
              <h3>Previous Periods</h3>
              <p>Completed monthly and yearly balances are kept here.</p>
            </div>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Leave Type</th>
                  <th>Allocated</th>
                  <th>Used</th>
                  <th>Remaining</th>
                </tr>
              </thead>
              <tbody>
                {history.map((balance) => {
                  const period = balance.period_month
                    ? new Date(
                        Number(balance.period_year),
                        Number(balance.period_month) - 1,
                        1
                      ).toLocaleDateString(undefined, { month: "long", year: "numeric" })
                    : `${balance.period_year}`;

                  return (
                    <tr key={balance.id}>
                      <td>{period}</td>
                      <td>{balance.name}</td>
                      <td>{balance.total_days}</td>
                      <td>{balance.used_days}</td>
                      <td>{balance.remaining_days}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeaveBalance;
