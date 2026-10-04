import { useEffect, useState } from "react";
import api from "../../services/api";
import Loading from "../../components/Loading";

function LeaveBalance() {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await api.get("/leaves/balance");

      setBalances(response.data.balances || []);
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

          return (
            <div className="leave-balance-card" key={balance.id}>
              <div className="balance-card-icon">
                ◫
              </div>

              <h3>{balance.name}</h3>

              <p className="balance-description">
                Leave allocation for this year
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
    </div>
  );
}

export default LeaveBalance;