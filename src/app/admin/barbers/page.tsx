"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBarbers } from "@/hooks/useBarbers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Users, ShieldAlert } from "lucide-react";

export default function AdminBarbersPage() {
  const { isAdmin } = useAuth();
  const { barbers, loading, error, createBarber, deleteBarber } = useBarbers(true);

  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || name.trim().length < 2) {
      setFormError("O nome do barbeiro deve ter pelo menos 2 caracteres.");
      return;
    }

    setSubmitting(true);
    const ok = await createBarber({
      name: name.trim(),
      is_active: true,
    });

    if (ok) {
      setName("");
    } else {
      setFormError(error || "Erro ao cadastrar barbeiro.");
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Deseja desativar o barbeiro "${name}"? Ele deixará de receber novos agendamentos.`)) {
      await deleteBarber(id);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-muted-foreground space-y-2">
        <ShieldAlert className="mx-auto h-12 w-12 text-rose-500" />
        <h2 className="text-lg font-bold text-gray-900">Acesso Restrito ao Dono / Administrador</h2>
        <p className="text-sm">Apenas gerentes gerais têm permissão para cadastrar e desativar barbeiros da barbearia.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Gerenciar Barbeiros</h1>
        <p className="text-sm text-gray-500">
          Cadastre novos membros da equipe ou desative profissionais que não estão atendendo.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* FORMULÁRIO DE CADASTRO */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Novo Barbeiro
            </CardTitle>
            <CardDescription>Cadastre um barbeiro para a equipe</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="barber_name">Nome do Barbeiro *</Label>
                <Input
                  id="barber_name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Carlos Silva"
                  disabled={submitting}
                  required
                />
              </div>

              {formError && (
                <p className="text-xs text-destructive bg-destructive/10 p-2.5 rounded">{formError}</p>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Cadastrar Barbeiro"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* TABELA DE BARBEIROS CADASTRADOS */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Equipe de Barbeiros
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : barbers.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Users className="mx-auto h-10 w-10 mb-2 opacity-30" />
                <p>Nenhum barbeiro cadastrado ainda.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {barbers.map((barber) => (
                      <TableRow key={barber.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                              {barber.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-sm">{barber.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {barber.is_active ? (
                            <Badge variant="default" className="bg-emerald-100 text-emerald-800 border-emerald-300">
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {barber.is_active && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(barber.id, barber.name)}
                              title="Desativar barbeiro"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
