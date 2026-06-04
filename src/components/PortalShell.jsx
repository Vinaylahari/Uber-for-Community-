/** Mobile-first shell: max 480px for member/volunteer portals */
export default function PortalShell({ children, className = '' }) {
  return (
    <div className={`min-h-screen bg-background mx-auto w-full max-w-[480px] ${className}`}>
      {children}
    </div>
  );
}
