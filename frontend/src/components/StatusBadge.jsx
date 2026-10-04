function StatusBadge({ status }) {
  const statusClass = status?.toLowerCase();

  return (
    <span className={`status-badge ${statusClass}`}>
      {status}
    </span>
  );
}

export default StatusBadge;