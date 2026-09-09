"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useServices } from "@/hooks/useServices";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Scissors, Check, X, ShieldAlert } from "lucide-react";

export default function AdminServicesPage() {
  const { isAdmin } = useAuth();
  const { services, loading, error, createService, deleteService } = useServices(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("30");
  const [price, setPrice] = useState("45.00");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const priceNum = parseFloat(price.replace(",", "."));
    const durationNum = parseInt(duration, 10);

    if (!name.trim()) {
      setFormError("Informe o nome do serviço.");
      return;
    }

    if (isNaN(priceNum) || priceNum < 0) {
      setFormError("O preço não pode ser negativo.");
      return;
    }

    if (isNaN(durationNum) || durationNum <= 0) {
      setFormError("A duração deve ser maior que 0 minutos.");
      return;
    }

    setSubmitting(true);
    const ok = await createService({
      name: name.trim(),
      description: description.trim() || undefined,
      duration_minutes: durationNum,
      price: priceNum,
      is_active: true,
    });

    if (ok) {
      setName("");
      setDescription("");
      setDuration("30");
      setPrice("45.00");
    } else {
      setFormError(error || "Erro ao cadastrar serviço.");
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Deseja desativar o serviço "${name}"?`)) {
      await deleteService(id);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-muted-foreground space-y-2">
        <ShieldAlert className="mx-auto h-12 w-12 text-rose-500" />
        <h2 className="text-lg font-bold text-gray-900">Acesso Restrito ao Dono / Administrador</h2>
        <p className="text-sm">Apenas gerentes gerais têm permissão para criar e alterar serviços da barbearia.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Gerenciar Serviços</h1>
        <p className="text-sm text-gray-500">
          Cadastre novos serviços, edite preços e defina a duração de cada procedimento.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* FORMULÁRIO DE CADASTRO */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Novo Serviço
            </CardTitle>
            <CardDescription>Adicione uma opção ao cardápio da barbearia</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome do Serviço *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Corte Degradê"
                  disabled={submitting}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Lavagem + finalização com pomada"
                  disabled={submitting}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="duration">Duração (min) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="5"
                    step="5"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="price">Preço (R$) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.50"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
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
                  "Cadastrar Serviço"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* TABELA DE SERVIÇOS CADASTRADOS */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Scissors className="h-4 w-4" />
              Serviços Cadastrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Scissors className="mx-auto h-10 w-10 mb-2 opacity-30" />
                <p>Nenhum serviço cadastrado ainda.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          <div className="font-semibold text-sm">{service.name}</div>
                          {service.description && (
                            <div className="text-xs text-muted-foreground">{service.description}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{service.duration_minutes} min</TableCell>
                        <TableCell className="font-bold text-sm text-primary">
                          R$ {Number(service.price).toFixed(2).replace(".", ",")}
                        </TableCell>
                        <TableCell>
                          {service.is_active ? (
                            <Badge variant="default" className="bg-emerald-100 text-emerald-800 border-emerald-300">
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inativo</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {service.is_active && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(service.id, service.name)}
                              title="Desativar serviço"
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
