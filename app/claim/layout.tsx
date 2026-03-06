export default function ClaimLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>

      {/* Holiday-themed decorative elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        {/* Top left snowflake/star */}
        <div className="absolute top-10 left-10 animate-pulse">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            className="text-red-200 opacity-50"
          >
            <path
              d="M12 2L13.09 8.26L19 7L15.45 11.82L21 16L14.81 16.39L16 23L12 18.67L8 23L9.19 16.39L3 16L8.55 11.82L5 7L10.91 8.26L12 2Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Top right snowflake/star */}
        <div className="absolute top-20 right-20 animate-pulse animation-delay-2000">
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            className="text-green-200 opacity-40"
          >
            <path
              d="M12 2L13.09 8.26L19 7L15.45 11.82L21 16L14.81 16.39L16 23L12 18.67L8 23L9.19 16.39L3 16L8.55 11.82L5 7L10.91 8.26L12 2Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Bottom left decoration */}
        <div className="absolute bottom-20 left-16 animate-pulse animation-delay-4000">
          <svg
            width="35"
            height="35"
            viewBox="0 0 24 24"
            fill="none"
            className="text-yellow-200 opacity-30"
          >
            <path
              d="M12 2L13.09 8.26L19 7L15.45 11.82L21 16L14.81 16.39L16 23L12 18.67L8 23L9.19 16.39L3 16L8.55 11.82L5 7L10.91 8.26L12 2Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Bottom right decoration */}
        <div className="absolute bottom-32 right-10 animate-pulse animation-delay-1000">
          <svg
            width="45"
            height="45"
            viewBox="0 0 24 24"
            fill="none"
            className="text-blue-200 opacity-25"
          >
            <path
              d="M12 2L13.09 8.26L19 7L15.45 11.82L21 16L14.81 16.39L16 23L12 18.67L8 23L9.19 16.39L3 16L8.55 11.82L5 7L10.91 8.26L12 2Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10">
        {children}
      </div>
    </>
  );
}