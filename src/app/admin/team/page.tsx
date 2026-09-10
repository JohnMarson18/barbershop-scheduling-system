"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBarbers } from "@/hooks/useBarbers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, UserCheck, ShieldAlert, KeyRound, CheckCircle2 } from "lucide-react";
import { UserRole } from "@/types/api";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  barber_id?: string | null;
  barber_name?: string;
}

export default function AdminTeamPage() {
  const { profile, isAdmin, register, getAuthHeaders } = useAuth();
  const { barbers } = useBarbers();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("barber");
  const [barberId, setBarberId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);

  const fetchTeamMembers = useCallback(async () => {
    setLoadingTeam(true);
    try {
      const res = await fetch("/api/admin/team", {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setTeamMembers(data.data);
      }
    } catch (err) {
      console.error("Erro ao carregar equipe:", err);
    } finally {
      setLoadingTeam(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    if (isAdmin) {
      fetchTeamMembers();
    }
  }, [isAdmin, fetchTeamMembers]);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setFormMsg({ type: "error", text: "Preencha todos os campos obrigatórios." });
      return;
    }

    if (role === "barber" && !barberId) {
      setFormMsg({ type: "error", text: "Vincule o login a um barbeiro cadastrado." });
      return;
    }

    setSubmitting(true);
    const res = await register({
      name: name.trim(),
      email: email.trim(),
      password: password.trim(),
      role,
      barber_id: role === "barber" ? barberId : null,
      lgpd_consent: true,
    });
    setSubmitting(false);

    if (res.success) {
      await fetchTeamMembers();
      setFormMsg({ type: "success", text: `Conta para ${name} criada com sucesso!` });
      setName("");
      setEmail("");
      setPassword("");
      setBarberId("");
    } else {
      setFormMsg({ type: "error", text: res.error || "Erro ao cadastrar membro da equipe." });
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-muted-foreground space-y-2">
        <ShieldAlert className="mx-auto h-12 w-12 text-rose-500" />
        <h2 className="text-lg font-bold text-gray-900">Acesso Restrito ao Dono / Administrador</h2>
        <p className="text-sm">Apenas gerentes gerais têm permissão para criar e gerenciar logins da equipe.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Equipe & Logins de Acesso</h1>
        <p className="text-sm text-gray-500">
          Crie logins individuais com senha para cada barbeiro ou gerente da barbearia.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* FORMULÁRIO DE NOVO LOGIN */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Novo Acesso da Equipe
            </CardTitle>
            <CardDescription>
              Crie uma conta com email e senha para o profissional
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateMember} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="m_name">Nome Completo *</Label>
                <Input
                  id="m_name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Pedro Barbeiro"
                  disabled={submitting}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="m_email">Email de Acesso *</Label>
                <Input
                  id="m_email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pedro@barbearia.com"
                  disabled={submitting}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="m_pass">Senha Inicial *</Label>
                <Input
                  id="m_pass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  disabled={submitting}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Função / Permissão *</Label>
                <Select value={role} onValueChange={(val: UserRole) => setRole(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="barber">Barbeiro (Vê apenas sua agenda)</SelectItem>
                    <SelectItem value="admin">Gerente Geral (Acesso irrestrito)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role === "barber" && (
                <div className="space-y-1.5">
                  <Label>Vincular ao Barbeiro Cadastrado *</Label>
                  <Select value={barberId} onValueChange={setBarberId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o perfil do barbeiro" />
                    </SelectTrigger>
                    <SelectContent>
                      {barbers.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Garante que o barbeiro visualize apenas os clientes atribuídos a ele.
                  </p>
                </div>
              )}

              {formMsg && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    formMsg.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-destructive/10 text-destructive border border-destructive/20"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{formMsg.text}</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Criando Acesso...
                  </>
                ) : (
                  "Criar Acesso"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* TABELA DE MEMBROS ATUAIS */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Usuários da Barbearia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Vínculo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingTeam ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                        Carregando equipe...
                      </TableCell>
                    </TableRow>
                  ) : teamMembers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nenhum membro da equipe encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    teamMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-semibold text-sm">
                          {member.name}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {member.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={member.role === "admin" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {member.role === "admin" ? "Gerente Geral" : "Barbeiro"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {member.barber_name}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
