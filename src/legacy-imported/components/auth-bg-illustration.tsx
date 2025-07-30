export const AuthBgIllustration = ({ className }: { className?: string }) => (
    <svg
      className={className}
      width="1440"
      height="1024"
      viewBox="0 0 1440 1024"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M-288.083 1024L1728.92 0L1728.92 1024H-288.083Z"
        fill="url(#bg-gradient-1)"
      />
      <path
        d="M-288.083 0L1728.92 1024L-288.083 1024L-288.083 0Z"
        fill="url(#bg-gradient-2)"
      />
      <defs>
        <linearGradient
          id="bg-gradient-1"
          x1="720.417"
          y1="0"
          x2="720.417"
          y2="1024"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="hsl(var(--primary))" stopOpacity="0.2" />
          <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          id="bg-gradient-2"
          x1="720.417"
          y1="0"
          x2="720.417"
          y2="1024"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="hsl(var(--primary))" stopOpacity="0.1" />
          <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
