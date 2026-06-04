export default function PriorityBadge({ priority }) {
  const p = priority || 'normal';
  const styles = {
    emergency: 'bg-danger text-white',
    urgent: 'bg-warning text-gray-900',
    normal: 'bg-success text-gray-900',
  };
  const labels = {
    emergency: 'Emergency',
    urgent: 'Urgent',
    normal: 'Normal',
  };
  return (
    <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${styles[p] || styles.normal}`}>
      {labels[p] || p}
    </span>
  );
}
