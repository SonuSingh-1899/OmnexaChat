// components/AuthCard.jsx
const AuthCard = ({ children, title, subtitle, showLogo = false, showBack = false, onBack }) => {
  return (
    <div className="min-h-screen bg-[#e8e6e1] flex items-center justify-center p-4 font-sans">
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500&family=Playfair+Display:wght@400;500&display=swap" rel="stylesheet" />

      <div className="w-full max-w-[380px] rounded-[32px] overflow-hidden shadow-[0_28px_64px_rgba(0,0,0,0.20),0_4px_16px_rgba(0,0,0,0.08)]">
        <div className={`bg-black relative overflow-hidden ${showLogo ? 'h-[200px]' : 'h-[160px]'}`}>
          <svg
            className="absolute inset-0 w-full h-full opacity-18"
            viewBox="0 0 380 200"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
          >
            <circle cx="30" cy="30" r="45" fill="white" opacity="0.5" />
            <rect x="70" y="5" width="55" height="55" rx="8" fill="white" opacity="0.3" transform="rotate(15 97 32)" />
            <polygon points="220,0 290,0 255,60" fill="white" opacity="0.35" />
            <rect x="300" y="20" width="50" height="50" rx="6" fill="white" opacity="0.25" transform="rotate(-10 325 45)" />
            <circle cx="360" cy="30" r="55" fill="white" opacity="0.2" />
            <circle cx="340" cy="170" r="65" fill="white" opacity="0.25" />
            <rect x="0" y="130" width="70" height="70" rx="10" fill="white" opacity="0.2" transform="rotate(-8 35 165)" />
            <polygon points="130,150 185,135 165,195 110,200" fill="white" opacity="0.3" />
            <circle cx="210" cy="185" r="30" fill="white" opacity="0.2" />
            <rect x="170" y="50" width="40" height="40" rx="5" fill="white" opacity="0.15" transform="rotate(25 190 70)" />
          </svg>

          {showBack && (
            <button
              onClick={onBack}
              className="absolute top-[18px] left-[18px] bg-none border-none cursor-pointer flex items-center p-1"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>
          )}

          {showBack && title && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-serif text-2xl font-normal tracking-[0.3px] whitespace-nowrap">
              {title}
            </div>
          )}

          {showLogo && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-14 h-14 bg-white rounded-[14px] flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect x="4" y="4" width="24" height="24" rx="6" fill="#111" />
                  <rect x="9" y="9" width="14" height="14" rx="4" fill="white" />
                </svg>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-tl-[36px] -mt-9 p-9 pt-9 pb-8 relative z-[2]">
          {!showBack && title && (
            <>
              <h2 className="font-serif text-[28px] font-normal text-black mb-1.5 tracking-[-0.3px]">
                {title}
              </h2>
              {subtitle && (
                <p className="text-[13px] text-stone-400 mb-7 font-light">
                  {subtitle}
                </p>
              )}
            </>
          )}

          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthCard;