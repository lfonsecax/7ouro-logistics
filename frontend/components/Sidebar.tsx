"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Truck, Users, MapPin, Fuel,
  Wrench, Building2, Package, ChevronRight, ChevronDown,
  FileText, ClipboardList, Settings2,
} from "lucide-react";
import clsx from "clsx";

const mainNav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/diario", label: "Diário de Bordo", icon: ClipboardList },
  { href: "/relatorios", label: "Relatórios", icon: FileText },
];

const dadosNav = [
  { href: "/rotas", label: "Rotas", icon: MapPin },
  { href: "/abastecimento", label: "Abastecimento", icon: Fuel },
  { href: "/manutencao", label: "Manutenção", icon: Wrench },
  { href: "/caminhoes", label: "Caminhões", icon: Truck },
  { href: "/funcionarios", label: "Funcionários", icon: Users },
  { href: "/clientes", label: "Clientes", icon: Building2 },
  { href: "/fornecedores", label: "Fornecedores", icon: Package },
  { href: "/faturas", label: "Faturas", icon: FileText },
];

const dadosHrefs = dadosNav.map((d) => d.href);

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const isDadosActive = dadosHrefs.includes(pathname);
  const [dadosOpen, setDadosOpen] = useState(isDadosActive);

  useEffect(() => {
    if (isDadosActive) setDadosOpen(true);
  }, [isDadosActive]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`w-60 bg-gray-900 border-r border-gray-800 flex flex-col fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 md:relative md:inset-auto md:z-auto md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-6 py-5 border-b border-gray-800">
          <span className="text-brand-500 font-bold text-xl tracking-tight">7Ouro</span>
          <span className="text-gray-400 text-sm ml-1">Logistics</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* Main navigation */}
          {mainNav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
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

          {/* Separator */}
          <div className="py-2">
            <div className="border-t border-gray-800" />
          </div>

          {/* Dados accordion */}
          <div>
            <button
              onClick={() => setDadosOpen(!dadosOpen)}
              className={clsx(
                "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isDadosActive
                  ? "text-gray-200"
                  : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
              )}
            >
              <Settings2 size={16} />
              <span className="flex-1 text-left">Dados</span>
              {dadosOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>

            {dadosOpen && (
              <div className="ml-2 mt-1 space-y-0.5 pl-3 border-l border-gray-800">
                {dadosNav.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={onClose}
                      className={clsx(
                        "flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                        active
                          ? "bg-gray-800 text-white"
                          : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/50"
                      )}
                    >
                      <Icon size={14} />
                      {label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        <div className="px-6 py-4 text-xs text-gray-600 border-t border-gray-800">
          v1.0.0
        </div>
      </aside>
    </>
  );
}
