"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, X } from "lucide-react";
import { siteConfig } from "@/config/site";

export function PrivacyPolicyModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-amber-500 hover:text-amber-400 underline underline-offset-2 transition-colors inline-flex items-center gap-1 font-medium"
      >
        Termos de Privacidade &bull; LGPD
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-neutral-100">Política de Privacidade & LGPD</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-neutral-200 p-1 rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-neutral-300 leading-relaxed">
              <div>
                <h4 className="font-semibold text-neutral-100 mb-1">1. Quais dados coletamos?</h4>
                <p>
                  A <strong>{siteConfig.name}</strong> coleta estritamente seu <strong>Nome Completo</strong> e <strong>Número de WhatsApp</strong> para viabilizar o agendamento de serviços.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-neutral-100 mb-1">2. Qual a finalidade do uso?</h4>
                <p>
                  Seus dados são utilizados exclusivamente para:
                </p>
                <ul className="list-disc list-inside mt-1 space-y-1 text-neutral-400">
                  <li>Identificar seu horário na bancada do barbeiro escolhido;</li>
                  <li>Enviar mensagens automáticas de confirmação e lembretes de atendimento;</li>
                  <li>Evitar reservas duplicadas e horários vagos por desencontro.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-neutral-100 mb-1">3. Compartilhamento de dados</h4>
                <p>
                  Nenhum dado é vendido, alugado ou compartilhado com terceiros para fins comerciais. Seus dados ficam protegidos em servidores seguros com criptografia.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-neutral-100 mb-1">4. Seus Direitos (Art. 18 da LGPD)</h4>
                <p>
                  Você é o titular de seus dados e pode, a qualquer momento, solicitar a visualização, correção ou a <strong>exclusão/anonimização permanente</strong> de seu histórico de atendimento diretamente na Área do Cliente ou com a gerência da barbearia.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex justify-end">
              <Button
                type="button"
                onClick={() => setIsOpen(false)}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-100"
              >
                Entendi e Concordo
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
