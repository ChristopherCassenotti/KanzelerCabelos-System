import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Scissors, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { DEFAULT_PRIVATE_ROUTE, resolvePostLoginTarget } from "../components/auth/redirect";
import { useAuth } from "../contexts/AuthContext";
import { loginSchema, type LoginFormData } from "../schemas/auth.schema";
import { ApiError } from "../services/api/errors";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      senha: "",
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);

    try {
      await login(data);

      navigate(resolvePostLoginTarget(location.state) ?? DEFAULT_PRIVATE_ROUTE, { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
        return;
      }

      setSubmitError("Não foi possível entrar. Tente novamente.");
    }
  });

  return (
    <main className="min-h-screen bg-[var(--kanzler-canvas)] lg:grid lg:grid-cols-[minmax(420px,0.95fr)_minmax(520px,1.05fr)]">
      <section className="relative hidden overflow-hidden bg-[var(--kanzler-navy)] p-12 text-white lg:flex lg:min-h-screen lg:flex-col">
        <div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-[var(--kanzler-blue)]/15 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-[#5b8cff]/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--kanzler-blue)] text-white shadow-lg shadow-blue-950/20">
            <Scissors size={21} strokeWidth={2.2} />
          </div>
          <div>
            <p className="kanzler-display text-lg font-bold leading-none">Kanzler Cabelos</p>
            <p className="mt-1 text-xs text-slate-400">Gestão de Compra</p>
          </div>
        </div>

        <div className="relative my-auto max-w-xl py-16">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#7ea2ff]">
            Operação centralizada
          </p>
          <h1 className="kanzler-display text-4xl font-bold leading-[1.1] tracking-[-0.04em] xl:text-5xl">
            Clientes, rotas e compras em um único lugar.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
            Acesse o sistema para organizar avaliações, acompanhar recompras e manter o histórico comercial da Kanzler Cabelos.
          </p>

          <div className="mt-10 flex max-w-md items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
            <ShieldCheck className="mt-0.5 shrink-0 text-[#7ea2ff]" size={20} />
            <p className="text-sm leading-6 text-slate-300">
              Sua sessão usa token de acesso temporário e renovação segura por cookie HttpOnly.
            </p>
          </div>
        </div>

        <p className="relative text-xs text-slate-500">Kanzler Cabelos · Sistema interno</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-[430px]">
          <div className="mb-9 flex items-center gap-3 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--kanzler-blue)] text-white">
              <Scissors size={19} />
            </div>
            <div>
              <p className="kanzler-display font-bold text-[var(--kanzler-navy)]">Kanzler Cabelos</p>
              <p className="text-xs text-[var(--kanzler-muted)]">Gestão de Compra</p>
            </div>
          </div>

          <div className="rounded-[18px] border border-[var(--kanzler-line)] bg-white p-6 shadow-[var(--kanzler-shadow)] sm:p-8">
            <div className="mb-7">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--kanzler-blue)]">
                Acesso ao sistema
              </p>
              <h2 className="kanzler-display text-2xl font-bold tracking-[-0.025em] text-[var(--kanzler-navy)]">
                Entre na sua conta
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--kanzler-muted)]">
                Use o e-mail e a senha cadastrados no acesso interno.
              </p>
            </div>

            <form className="space-y-5" onSubmit={onSubmit} noValidate>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-[var(--kanzler-ink)]">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@empresa.com"
                  className="w-full rounded-[10px] border border-[var(--kanzler-line)] bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[var(--kanzler-blue)] focus:shadow-[0_0_0_3px_var(--kanzler-blue-soft)]"
                  aria-invalid={Boolean(errors.email)}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs font-medium text-[var(--kanzler-red)]">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="senha" className="mb-1.5 block text-sm font-semibold text-[var(--kanzler-ink)]">
                  Senha
                </label>
                <div className="relative">
                  <LockKeyhole
                    size={17}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--kanzler-muted-2)]"
                    aria-hidden="true"
                  />
                  <input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Sua senha"
                    className="w-full rounded-[10px] border border-[var(--kanzler-line)] bg-white py-3 pl-10 pr-11 text-sm outline-none transition focus:border-[var(--kanzler-blue)] focus:shadow-[0_0_0_3px_var(--kanzler-blue-soft)]"
                    aria-invalid={Boolean(errors.senha)}
                    {...register("senha")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-[var(--kanzler-muted)] transition hover:bg-[var(--kanzler-canvas)] hover:text-[var(--kanzler-ink)]"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errors.senha && (
                  <p className="mt-1.5 text-xs font-medium text-[var(--kanzler-red)]">{errors.senha.message}</p>
                )}
              </div>

              {submitError && (
                <div
                  className="rounded-[10px] border border-[#f3cccc] bg-[var(--kanzler-red-soft)] px-3.5 py-3 text-sm text-[var(--kanzler-red)]"
                  role="alert"
                >
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-[var(--kanzler-blue)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--kanzler-blue-dark)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && <LoaderCircle className="animate-spin" size={17} aria-hidden="true" />}
                {isSubmitting ? "Entrando..." : "Entrar"}
              </button>
            </form>
          </div>

          <p className="mt-5 text-center text-xs leading-5 text-[var(--kanzler-muted-2)]">
            Não há cadastro público. O acesso é gerenciado internamente.
          </p>
        </div>
      </section>
    </main>
  );
}
