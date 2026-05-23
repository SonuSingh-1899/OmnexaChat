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

const BrandMark = ({ compact = false }) => (
  <div className="flex items-center gap-3">
    <div className={`flex items-center justify-center rounded-2xl ${compact ? 'h-12 w-12' : 'h-16 w-16'}`}>
      <img
        src={UnionImg}
        alt="Omnexa logo"
        className={`${compact ? 'h-12 w-12' : 'h-20 w-20'} object-contain`}
      />
    </div>
    <div>
      <p className={`uppercase tracking-[0.28em] text-zinc-400 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
        Chat workspace
      </p>
      <h1 className={`font-['Fraunces'] font-semibold tracking-[-0.04em] ${compact ? 'text-2xl' : 'text-3xl sm:text-4xl'}`}>
        Omnexa
      </h1>
    </div>
  </div>
);

const BrandPanel = ({ content, showLogo }) => (
  <section className="relative flex flex-col justify-between overflow-hidden bg-[linear-gradient(145deg,#09090b_0%,#18181b_48%,#27272a_100%)] px-6 py-8 text-white sm:px-8 sm:py-10 lg:px-14 lg:py-14">
    <div
      className="pointer-events-none absolute -left-20 top-8 h-52 w-52 rounded-full blur-3xl"
      style={{ background: 'rgba(255,255,255,0.08)' }}
    />
    <div
      className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full blur-3xl"
      style={{ background: 'rgba(161,161,170,0.18)' }}
    />

    <div className="relative">
      <div className="mb-8 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-300">
        Private chat flow
      </div>
      <BrandMark />
    </div>

    <div className="relative my-10 lg:my-0">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-400">
        {content.label}
      </p>
      <h2 className="mt-4 max-w-xl font-['Fraunces'] text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
        {content.heading}
      </h2>
      <p className="mt-5 max-w-lg text-sm leading-7 text-zinc-300 sm:text-base">
        {content.text}
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Fast access</p>
          <p className="mt-2 text-sm leading-6 text-zinc-200">Jump from auth to chat, profile, and notifications with one consistent flow.</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Secure entry</p>
          <p className="mt-2 text-sm leading-6 text-zinc-200">OTP and account actions stay in one calm, readable layout across screens.</p>
        </div>
      </div>
    </div>

    <div className="relative flex items-center justify-between border-t border-white/10 pt-6 text-sm text-zinc-400">
      <span>Simple. Secure.</span>
      {showLogo && <span className="font-medium text-zinc-200">Welcome to Omnexa</span>}
    </div>
  </section>
);

const AuthPanel = ({ children, title, subtitle, showBack, onBack, showLogo }) => (
  <section className="flex items-center justify-center bg-[radial-gradient(circle_at_top,#ffffff_0%,#f4f4f5_48%,#e4e4e7_100%)] ">
    <div className="w-full max-w-md rounded-4xl border border-white/70 bg-white/92 p-5 shadow-[0_25px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-7">
      {showLogo && (
        <div className="mb-7 rounded-3xl border border-zinc-200/80 bg-zinc-50/90 px-4 py-4 lg:hidden">
          <BrandMark compact />
        </div>
      )}

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
          showLogo={showLogo}
        >
          {children}
        </AuthPanel>
      </div>
    </div>
  );
};

export default AuthCard;
