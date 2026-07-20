import {
  LayoutDashboard,
  FlaskConical,
  Boxes,
  ClipboardPlus,
  LineChart,
  Gauge,
  Globe,
  FileText,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

/** Flujo lógico de trabajo del control de calidad (ver docs/SDD.md §7.2). */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Panel", description: "Resumen general", icon: LayoutDashboard },
  { href: "/parametros", label: "Parámetros", description: "Analitos, ETa, CVi/CVg", icon: FlaskConical },
  { href: "/lotes", label: "Lotes", description: "Controles de tercera opinión", icon: Boxes },
  { href: "/ingreso", label: "Ingreso diario", description: "Corridas y reglas Westgard", icon: ClipboardPlus },
  { href: "/levey-jennings", label: "Levey-Jennings", description: "Gráficas de control", icon: LineChart },
  { href: "/indicadores", label: "Indicadores", description: "CV, sesgo, ET, Sigma", icon: Gauge },
  { href: "/externo", label: "CCE / Externo", description: "Control de calidad externo", icon: Globe },
  { href: "/informe", label: "Informe", description: "Cierre mensual y PDF", icon: FileText },
  { href: "/configuracion", label: "Configuración", description: "IPS y catálogos", icon: Settings },
];
