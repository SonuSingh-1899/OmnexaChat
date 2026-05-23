const PushNotificationPrompt = ({ onEnable, onDismiss, isBusy }) => (
  <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:max-w-md">
    <div className="rounded-[1.75rem] border border-zinc-200 bg-white/95 p-4 shadow-[0_20px_45px_rgba(15,23,42,0.16)] backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
            <path d="M10 17a2 2 0 0 0 4 0" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Push notifications
          </p>
          <h3 className="mt-1 text-base font-semibold text-zinc-950">
            New message alerts on lock screen
          </h3>
          <p className="mt-1 mb-0 text-sm leading-6 text-zinc-600">
            Enable notifications to get instant Omnexa message alerts even when the app is in the background.
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-600 transition hover:border-zinc-300 hover:text-zinc-900"
        >
          Later
        </button>
        <button
          type="button"
          onClick={onEnable}
          disabled={isBusy}
          className="rounded-2xl bg-[linear-gradient(135deg,#09090b_0%,#27272a_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_28px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy ? 'Enabling...' : 'Enable now'}
        </button>
      </div>
    </div>
  </div>
);

export default PushNotificationPrompt;
