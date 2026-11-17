import Icon from '../Icon';

// 로그인 / 회원가입 공통 틀
export const authInputClass =
  'h-12 w-full rounded-xl bg-surface-container-low px-4 text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-secondary/40';

export default function AuthCard({ title, subtitle, onSubmit, error, submitLabel, loading, footer, children }) {
  return (
    <div className="px-margin pt-space-xl">
      <div className="mb-space-lg flex flex-col items-center text-center">
        <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-fixed text-secondary">
          <Icon name="local_cafe" filled className="text-[28px]" />
        </span>
        <h1 className="text-headline-lg tracking-tight text-primary-container">{title}</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">{subtitle}</p>
      </div>

      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-lowest p-space-lg shadow-[0_8px_30px_rgba(46,26,18,0.06)]"
      >
        {children}
        {error && <p className="rounded-lg bg-error-container px-3 py-2 text-body-sm text-on-error-container">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-space-sm h-[52px] rounded-full bg-primary-container text-label-lg text-on-primary shadow-md transition-all active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? '잠시만요...' : submitLabel}
        </button>
      </form>

      <p className="mt-space-lg text-center text-body-md text-on-surface-variant">{footer}</p>
    </div>
  );
}
