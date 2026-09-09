"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scissors, Lock, User, Mail, Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import { PrivacyPolicyModal } from "@/components/public/PrivacyPolicyModal";
import { siteConfig } from "@/config/site";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, loading: authLoading } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    const ok = await login(email, password);
    setSubmitting(false);

    if (ok) {
      const session = localStorage.getItem("barbearia_auth_session");
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed.role === "client") {
          router.push("/meus-agendamentos");
          router.refresh();
          return;
        }
      }
      router.push("/admin/dashboard");
      router.refresh();
    } else {
      setErrorMsg("Credenciais inválidas. Verifique seu email e senha.");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    const res = await register({
      name,
      email,
      password,
      role: "client",
      lgpd_consent: true,
    });
    setSubmitting(false);

    if (res.success) {
      router.push("/meus-agendamentos");
      router.refresh();
    } else {
      setErrorMsg(res.error || "Erro ao criar conta.");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* LOGO DA BARBEARIA */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-lg">
            <Scissors className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{siteConfig.name}</h1>
          <p className="text-xs text-neutral-400">
            Acesso para Clientes e Equipe da Barbearia
          </p>
        </div>

        {/* CARD PRINCIPAL */}
        <Card className="bg-neutral-900 border-neutral-800 text-neutral-100 shadow-2xl">
          <CardHeader className="pb-4">
            <div className="flex border-b border-neutral-800 pb-3 gap-4">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMsg(null);
                }}
                className={`text-sm font-semibold pb-1 transition-colors ${
                  mode === "login"
                    ? "border-b-2 border-amber-500 text-amber-400"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                Entrar na Conta
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setErrorMsg(null);
                }}
                className={`text-sm font-semibold pb-1 transition-colors ${
                  mode === "register"
                    ? "border-b-2 border-amber-500 text-amber-400"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                Criar Conta (Cliente)
              </button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="bg-destructive/15 border border-destructive/30 text-destructive text-xs p-3 rounded-lg">
                {errorMsg}
              </div>
            )}

            {mode === "login" ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="login_email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                    <Input
                      id="login_email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="pl-9 bg-neutral-950 border-neutral-800 text-neutral-100"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="login_pass">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                    <Input
                      id="login_pass"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-9 bg-neutral-950 border-neutral-800 text-neutral-100"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold"
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                  Entrar
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reg_name">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                    <Input
                      id="reg_name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      className="pl-9 bg-neutral-950 border-neutral-800 text-neutral-100"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg_email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                    <Input
                      id="reg_email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="pl-9 bg-neutral-950 border-neutral-800 text-neutral-100"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reg_pass">Senha</Label>
                  <Input
                    id="reg_pass"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="bg-neutral-950 border-neutral-800 text-neutral-100"
                    required
                  />
                </div>

                <div className="pt-2 text-xs text-neutral-400">
                  Ao criar sua conta, você concorda com nossa{" "}
                  <PrivacyPolicyModal /> conforme a LGPD.
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold"
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                  Cadastrar e Acessar
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex justify-center border-t border-neutral-800/80 pt-4 text-xs text-neutral-500">
            <button
              onClick={() => router.push("/")}
              className="hover:text-neutral-300 transition-colors inline-flex items-center gap-1"
            >
              ← Voltar para agendamento público
            </button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
