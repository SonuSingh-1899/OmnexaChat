import UnionImg from '../assets/Union.png';

const AUTH_COPY = {
  Login: {
    label: 'Welcome back',
    heading: 'Continue your conversations with Omnexa.',
    text: 'Sign in to open your dashboard, manage chats, and stay in sync across desktop and mobile.',
  },
  'Sign Up': {
    label: 'Create account',
    heading: 'Start your Omnexa workspace with a clean signup flow.',
    text: 'Create your profile, verify with OTP, and jump into a responsive messaging experience.',
  },
  'Verify OTP': {
    label: 'Verify access',
    heading: 'Confirm your email before entering Omnexa.',
    text: 'A quick OTP step keeps account creation secure and the onboarding flow straightforward.',
  },
  'Forgot Password': {
    label: 'Recover account',
    heading: 'Get back into Omnexa without the mess.',
    text: 'Request a reset code and continue with a simple recovery flow that works well on every screen size.',
  },
  'Reset Password': {
    label: 'Reset password',
    heading: 'Set a fresh password and return to Omnexa.',
    text: 'Use your OTP, choose a new password, and finish the recovery flow in a clean responsive layout.',
  },
};

const BrandPanel = ({ content, showLogo }) => (
  <section className="flex flex-col justify-between bg-linear-to-tl from-black via-zinc-800 to-zinc-700 px-6 py-8 text-white sm:px-8 sm:py-10 lg:px-14 lg:py-14">
    <div className="flex items-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-transparent">
        <img src={UnionImg} alt="Omnexa logo" className="h-20 w-20 object-contain" />
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-400">Chat workspace</p>
        <h1 className="font-['Fraunces'] text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
          Omnexa
        </h1>
      </div>
    </div>

    <div className="my-10 lg:my-0">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-400">
        {content.label}
      </p>
      <h2 className="mt-4 max-w-xl font-['Fraunces'] text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
        {content.heading}
      </h2>
      <p className="mt-5 max-w-lg text-sm leading-7 text-zinc-300 sm:text-base">
        {content.text}
      </p>
    </div>

    <div className="flex items-center justify-between border-t border-white/10 pt-6 text-sm text-zinc-400">
      <span>Simple. Secure.</span>
      {showLogo && <span className="font-medium text-zinc-200">Welcome back</span>}
    </div>
  </section>
);

const AuthPanel = ({ children, title, subtitle, showBack, onBack }) => (
  <section className="flex items-center justify-center bg-zinc-100 px-5 py-8 sm:px-8 sm:py-10 lg:px-14 lg:py-14">
    <div className="w-full max-w-md">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
            Omnexa access
          </p>
          <h3 className="mt-2 font-['Fraunces'] text-3xl font-semibold tracking-[-0.03em] text-zinc-950">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              {subtitle}
            </p>
          )}
        </div>

        {showBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 transition hover:border-zinc-300"
            aria-label="Go back"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
        )}
      </div>

      {children}
    </div>
  </section>
);

const AuthCard = ({
  children,
  title,
  subtitle,
  showLogo = false,
  showBack = false,
  onBack,
}) => {
  const content = AUTH_COPY[title] || AUTH_COPY.Login;

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <div className="hidden lg:flex">
          <BrandPanel content={content} showLogo={showLogo} />
        </div>
        <AuthPanel
          title={title}
          subtitle={subtitle}
          showBack={showBack}
          onBack={onBack}
        >
          {children}
        </AuthPanel>
      </div>
    </div>
  );
};

export default AuthCard;
