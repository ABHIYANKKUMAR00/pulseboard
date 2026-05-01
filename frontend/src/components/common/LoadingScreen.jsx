export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center animate-pulse">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <div className="flex gap-1">
          {[0,1,2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-brand-500"
              style={{ animation: `pulse 1s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
