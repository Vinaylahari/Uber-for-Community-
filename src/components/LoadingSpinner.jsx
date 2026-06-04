import { FaSpinner } from 'react-icons/fa';

export default function LoadingSpinner({ label = 'Loading...', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-10 ${className}`}>
      <FaSpinner className="animate-spin text-4xl text-primary mb-3" aria-hidden />
      <p className="text-gray-500 text-base">{label}</p>
    </div>
  );
}
