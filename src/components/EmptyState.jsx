export default function EmptyState({ icon: Icon, title, message }) {
  return (
    <div className="text-center py-10 px-4">
      {Icon && <Icon className="mx-auto text-5xl mb-3 text-gray-300" />}
      <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
      {message && <p className="text-gray-500 text-base">{message}</p>}
    </div>
  );
}
