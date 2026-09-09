"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useServices } from "@/hooks/useServices";
import { useBarbers } from "@/hooks/useBarbers";
import { AppointmentForm } from "@/components/public/AppointmentForm";
import { AvailableSlots } from "@/components/public/AvailableSlots";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Scissors,
  User,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Phone,
  Sparkles,
  ArrowRight,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { Appointment } from "@/schemas";
import { siteConfig } from "@/config/site";

export default function PublicAppointmentPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { services, loading: loadingServices } = useServices();
  const { barbers, loading: loadingBarbers } = useBarbers();

  // Gera os próximos 7 dias úteis a partir de hoje
  const availableDates = useMemo(() => {
    const dates: { dateStr: string; weekday: string; dayMonth: string; isSunday: boolean }[] = [];
    const now = new Date();

    for (let i = 0; i < 10; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      const isSunday = d.getDay() === 0;

      // Pula domingos (barbearia fechada)
      if (isSunday) continue;

      const weekday = i === 0 ? "Hoje" : i === 1 ? "Amanhã" : d.toLocaleDateString("pt-BR", { weekday: "short" });
      const dayMonth = d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });

      dates.push({ dateStr, weekday, dayMonth, isSunday });
      if (dates.length === 7) break;
    }
    return dates;
  }, []);

  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedBarberId, setSelectedBarberId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(() => availableDates[0]?.dateStr || "");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const selectedBarber = barbers.find((b) => b.id === selectedBarberId);

  const handleReset = () => {
    setSelectedServiceId("");
    setSelectedBarberId("");
    setSelectedDate(availableDates[0]?.dateStr || "");
    setSelectedSlot("");
    setConfirmedAppointment(null);
  };

  const handleWhatsAppShare = () => {
    if (!confirmedAppointment) return;
    const phone = siteConfig.whatsappNumber;
    const text = encodeURIComponent(
      `Olá! Acabei de agendar um horário na ${siteConfig.name}!\n` +
      `👤 *Cliente:* ${confirmedAppointment.client_name}\n` +
      `✂️ *Serviço:* ${selectedService?.name || "Serviço"}\n` +
      `💈 *Barbeiro:* ${selectedBarber?.name || "Barbeiro"}\n` +
      `📅 *Data:* ${confirmedAppointment.appointment_date}\n` +
      `⏰ *Horário:* ${confirmedAppointment.appointment_time}`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  };

  // TELA DE SUCESSO / COMPROVANTE DE AGENDAMENTO
  if (confirmedAppointment) {
    return (
      <main className="min-h-screen bg-neutral-900 text-neutral-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-neutral-950 border-neutral-800 text-neutral-100 shadow-2xl overflow-hidden">
          <div className="bg-emerald-600/20 border-b border-emerald-500/30 p-6 text-center">
            <div className="mx-auto w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center mb-3 shadow-lg shadow-emerald-950">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-emerald-400">Agendamento Confirmado!</h1>
            <p className="text-sm text-neutral-400 mt-1">
              Seu horário está garantido na {siteConfig.name}.
            </p>
          </div>

          <CardContent className="p-6 space-y-5">
            <div className="space-y-3 bg-neutral-900/80 rounded-lg p-4 border border-neutral-800 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-neutral-800">
                <span className="text-neutral-400">Cliente:</span>
                <span className="font-semibold text-neutral-200">{confirmedAppointment.client_name}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-800">
                <span className="text-neutral-400">WhatsApp:</span>
                <span className="font-mono text-neutral-200">{confirmedAppointment.client_whatsapp}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-800">
                <span className="text-neutral-400">Serviço:</span>
                <span className="font-medium text-amber-400">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-800">
                <span className="text-neutral-400">Barbeiro:</span>
                <span className="font-medium text-neutral-200">{selectedBarber?.name}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-neutral-800">
                <span className="text-neutral-400">Data:</span>
                <span className="font-medium text-neutral-200">{confirmedAppointment.appointment_date}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-neutral-400">Horário:</span>
                <span className="font-bold text-lg text-emerald-400">{confirmedAppointment.appointment_time}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button
                onClick={handleWhatsAppShare}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2"
              >
                <Phone className="h-5 w-5" />
                Avisar Barbearia no WhatsApp
                <ExternalLink className="h-4 w-4 opacity-70" />
              </Button>

              <Button
                variant="outline"
                onClick={handleReset}
                className="w-full border-neutral-700 text-neutral-300 hover:bg-neutral-800"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Fazer Outro Agendamento
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between">
      {/* HEADER / HERO DA BARBEARIA */}
      <header className="border-b border-neutral-800 bg-neutral-900/60 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Scissors className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-neutral-100">{siteConfig.name}</h1>
              <p className="text-xs text-neutral-400">Agendamento Online Instantâneo</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {profile ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(profile.role === "client" ? "/meus-agendamentos" : "/admin/dashboard")
                }
                className="border-neutral-800 bg-neutral-900 text-neutral-200 hover:bg-neutral-800 text-xs"
              >
                <User className="h-3.5 w-3.5 mr-1 text-amber-400" />
                {profile.name.split(" ")[0]} ({profile.role === "client" ? "Meus Agendamentos" : "Painel"})
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/login")}
                className="border-neutral-800 bg-neutral-900 text-neutral-200 hover:bg-neutral-800 text-xs"
              >
                <User className="h-3.5 w-3.5 mr-1 text-amber-400" />
                Área do Cliente / Entrar
              </Button>
            )}
            <Badge variant="outline" className="hidden sm:inline-flex border-amber-500/40 text-amber-400 bg-amber-500/5 text-xs py-1">
              <Sparkles className="h-3 w-3 mr-1" />
              Bio Instagram
            </Badge>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full space-y-8">
        {/* ETAPA 1: SELEÇÃO DO SERVIÇO */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold flex items-center gap-2 text-neutral-200">
              <span className="w-6 h-6 rounded-full bg-neutral-800 text-neutral-300 text-xs flex items-center justify-center font-bold">
                1
              </span>
              Escolha o Serviço
            </h2>
            {selectedService && (
              <span className="text-xs text-amber-400 font-medium">
                Selecionado: {selectedService.name}
              </span>
            )}
          </div>

          {loadingServices ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-lg bg-neutral-900 animate-pulse border border-neutral-800" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <Card className="bg-neutral-900 border-neutral-800 text-neutral-400 p-6 text-center">
              Nenhum serviço ativo encontrado.
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {services.map((service) => {
                const isSelected = selectedServiceId === service.id;
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => {
                      setSelectedServiceId(service.id);
                      setSelectedSlot("");
                    }}
                    className={`text-left p-4 rounded-xl border transition-all duration-150 flex flex-col justify-between ${
                      isSelected
                        ? "bg-amber-500/10 border-amber-500 ring-1 ring-amber-500 text-neutral-100 shadow-md"
                        : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:bg-neutral-900"
                    }`}
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="font-semibold text-base">{service.name}</div>
                      <Badge variant="secondary" className="text-xs bg-neutral-800 text-neutral-300 border-0">
                        {service.duration_minutes} min
                      </Badge>
                    </div>
                    {service.description && (
                      <p className="text-xs text-neutral-400 mt-1 line-clamp-2">{service.description}</p>
                    )}
                    <div className="mt-3 pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                      <span className="text-xs text-neutral-400">Valor</span>
                      <span className="font-bold text-amber-400">
                        R$ {Number(service.price).toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ETAPA 2: SELEÇÃO DO BARBEIRO */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold flex items-center gap-2 text-neutral-200">
              <span className="w-6 h-6 rounded-full bg-neutral-800 text-neutral-300 text-xs flex items-center justify-center font-bold">
                2
              </span>
              Escolha o Barbeiro
            </h2>
            {selectedBarber && (
              <span className="text-xs text-amber-400 font-medium">
                Selecionado: {selectedBarber.name}
              </span>
            )}
          </div>

          {loadingBarbers ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-neutral-900 animate-pulse border border-neutral-800" />
              ))}
            </div>
          ) : barbers.length === 0 ? (
            <Card className="bg-neutral-900 border-neutral-800 text-neutral-400 p-6 text-center">
              Nenhum barbeiro ativo encontrado.
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {barbers.map((barber) => {
                const isSelected = selectedBarberId === barber.id;
                return (
                  <button
                    key={barber.id}
                    type="button"
                    onClick={() => {
                      setSelectedBarberId(barber.id);
                      setSelectedSlot("");
                    }}
                    className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                      isSelected
                        ? "bg-amber-500/10 border-amber-500 ring-1 ring-amber-500 text-neutral-100 shadow-md"
                        : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:bg-neutral-900"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-300 shrink-0 font-bold text-sm">
                      {barber.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="font-medium text-sm truncate text-left">{barber.name}</div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ETAPA 3: SELEÇÃO DA DATA */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold flex items-center gap-2 text-neutral-200">
              <span className="w-6 h-6 rounded-full bg-neutral-800 text-neutral-300 text-xs flex items-center justify-center font-bold">
                3
              </span>
              Escolha a Data
            </h2>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
            {availableDates.map((item) => {
              const isSelected = selectedDate === item.dateStr;
              return (
                <button
                  key={item.dateStr}
                  type="button"
                  onClick={() => {
                    setSelectedDate(item.dateStr);
                    setSelectedSlot("");
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? "bg-amber-500/15 border-amber-500 ring-1 ring-amber-500 text-neutral-100 font-semibold shadow-md"
                      : "bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:bg-neutral-900"
                  }`}
                >
                  <span className="text-xs uppercase tracking-wider font-semibold opacity-80">{item.weekday}</span>
                  <span className="text-sm font-bold mt-0.5 text-neutral-100">{item.dayMonth}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ETAPA 4: HORÁRIOS E FORMULÁRIO DE CONFIRMAÇÃO */}
        {selectedServiceId && selectedBarberId && selectedDate ? (
          <section className="space-y-3 pt-2">
            <h2 className="text-base font-semibold flex items-center gap-2 text-neutral-200">
              <span className="w-6 h-6 rounded-full bg-neutral-800 text-neutral-300 text-xs flex items-center justify-center font-bold">
                4
              </span>
              Selecione o Horário e Confirme
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Box de Horários */}
              <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-1 text-neutral-100">
                <AvailableSlots
                  selectedDate={selectedDate}
                  selectedBarberId={selectedBarberId}
                  selectedServiceId={selectedServiceId}
                  selectedSlot={selectedSlot}
                  onSlotSelect={(slot) => setSelectedSlot(slot)}
                />
              </div>

              {/* Box de Formulário */}
              <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-1 text-neutral-100">
                <AppointmentForm
                  selectedDate={selectedDate}
                  selectedBarberId={selectedBarberId}
                  selectedServiceId={selectedServiceId}
                  selectedSlot={selectedSlot}
                  onSuccess={(appointment) => setConfirmedAppointment(appointment)}
                />
              </div>
            </div>
          </section>
        ) : (
          <div className="p-8 rounded-xl border border-dashed border-neutral-800 text-center text-neutral-500 space-y-1">
            <Clock className="mx-auto h-8 w-8 opacity-40 mb-2" />
            <p className="font-medium text-neutral-400">Complete as opções acima para liberar os horários</p>
            <p className="text-xs">Selecione o serviço e o barbeiro para consultar os horários vagos.</p>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-neutral-800/80 py-6 text-center text-xs text-neutral-500">
        <p>{siteConfig.name} &copy; {new Date().getFullYear()} &bull; Todos os direitos reservados</p>
      </footer>
    </div>
  );
}
