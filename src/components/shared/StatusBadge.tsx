import { Badge } from "@/components/ui/badge";
import { AppointmentStatus } from "@/types";

interface StatusBadgeProps {
  status: AppointmentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants = {
    scheduled: "default",
    attended: "default",
    cancelled: "destructive",
  } as const;

  const labels = {
    scheduled: "Pendente",
    attended: "Atendido",
    cancelled: "Cancelado",
  };

  const colors = {
    scheduled: "bg-yellow-100 text-yellow-800 border-yellow-300",
    attended: "bg-green-100 text-green-800 border-green-300",
    cancelled: "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <Badge variant={variants[status]} className={colors[status]}>
      {labels[status]}
    </Badge>
  );
}
