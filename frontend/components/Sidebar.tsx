"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Truck, Users, MapPin, Fuel,
  Wrench, Building2, Package, ChevronRight,
} from "lucide-react";
import clsx from "clsx";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/rotas", label: "Rotas", icon: MapPin },
  { href: "/abastecimento", label: "Abastecimento", icon: Fuel },
  { href: "/manutencao", label: "Manutenção", icon: Wrench },
  { href: "/caminhoes", label: "Caminhões", icon: Truck },
  { href: "/funcionarios", label: "Funcionários", icon: Users },
  { href: "/clientes", label: "Clientes", icon: Building2 },
  { href: "/fornecedores", label: "Fornecedores", icon: Package },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 min-h-screen bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="px-6 py-5 border-b border-gray-800">
        <span className="text-brand-500 font-bold text-xl tracking-tight">7Ouro</span>
        <span className="text-gray-400 text-sm ml-1">Logistics</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-brand-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
              )}
            >
              <Icon size={16} />
              {label}
              {active && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>
      <div className="px-6 py-4 text-xs text-gray-600 border-t border-gray-800">
        v1.0.0
      </div>
    </aside>
  );
}
