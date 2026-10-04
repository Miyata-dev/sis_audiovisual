export const Icon = ({ name, size = 20, className = "" }) => {
  const icons = {
    play: <path d="M5 3l14 9-14 9V3z" fill="currentColor" />,
    arrowLeft: <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />,
    arrowRight: <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />,
    plus: <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />,
    share: <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />,
    volume: <path d="M15.54 5.54L13.42 7.66a1 1 0 00-.29.7v7.27a1 1 0 00.29.7l2.12 2.12a1 1 0 001.7-.7V6.25a1 1 0 00-1.7-.71zM11 5L6 9H2v6h4l5 4V5z" fill="currentColor" />
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
      {icons[name]}
    </svg>
  );
};