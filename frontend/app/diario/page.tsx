"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Route, FuelRecord, MaintenanceRecord } from "@/lib/types";
import { ClipboardList, Fuel, Wrench, DollarSign, Plus, X } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "EUR" });
const fmtN = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

interface DailyEntry {
  date: string;
  label: string;
  routes: Route[];
  fuel: FuelRecord[];
  maintenance: MaintenanceRecord[];
}

export default function DiarioBordo() {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [entries, setEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      api.get<Route[]>(`/routes/?date_from=${selectedDate}&date_to=${selectedDate}`),
      api.get<FuelRecord[]>(`/fuel/?date_from=${selectedDate}&date_to=${selectedDate}`),
      api.get<MaintenanceRecord[]>(`/maintenance/?date_from=${selectedDate}&date_to=${selectedDate}`),
    ])
      .then(([routes, fuel, maintenance]) => {
        setEntries([{
          date: selectedDate,
          label: new Date(selectedDate).toLocaleDateString("pt-BR"),
          routes,
          fuel,
          maintenance,
        }]);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  const entry = entries[0];
  const totalRevenue = entry?.routes.reduce((s, r) => s + (r.total_revenue || 0), 0) || 0;
  const totalFuel = entry?.fuel.reduce((s, f) => s + (f.total || 0), 0) || 0;
  const totalMaint = entry?.maintenance.reduce((s, m) => s + (m.cost || 0), 0) || 0;
  const totalKm = entry?.routes.reduce((s, r) => s + (r.total_km || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Diário de Bordo</h1>
          <p className="text-gray-400 text-sm mt-0.5">Tudo que aconteceu no dia</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100"
        />
      </div>

      {loading && <p className="text-gray-500 text-sm">Carregando...</p>}
      {error && <p className="text-red-400 text-sm">Erro: {error}</p>}

      {!loading && !error && entry && (
        <>
          {/* Resumo do dia */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-900/40 to-gray-900 rounded-xl border border-blue-800/30 p-5">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList size={16} className="text-blue-400" />
                <p className="text-xs text-gray-400 uppercase tracking-wider">Rotas</p>
              </div>
              <p className="text-2xl font-bold text-blue-400">{entry.routes.length}</p>
              {totalKm > 0 && <p className="text-xs text-gray-500 mt-1">{fmtN(totalKm)} km</p>}
            </div>
            <div className="bg-gradient-to-br from-yellow-900/40 to-gray-900 rounded-xl border border-yellow-800/30 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Fuel size={16} className="text-yellow-400" />
                <p className="text-xs text-gray-400 uppercase tracking-wider">Combustível</p>
              </div>
              <p className="text-2xl font-bold text-yellow-400">{fmt(totalFuel)}</p>
              <p className="text-xs text-gray-500 mt-1">{entry.fuel.length} abastecimento(s)</p>
            </div>
            <div className="bg-gradient-to-br from-red-900/40 to-gray-900 rounded-xl border border-red-800/30 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Wrench size={16} className="text-red-400" />
                <p className="text-xs text-gray-400 uppercase tracking-wider">Manutenção</p>
              </div>
              <p className="text-2xl font-bold text-red-400">{fmt(totalMaint)}</p>
              <p className="text-xs text-gray-500 mt-1">{entry.maintenance.length} registo(s)</p>
            </div>
            <div className="bg-gradient-to-br from-green-900/40 to-gray-900 rounded-xl border border-green-800/30 p-5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={16} className="text-green-400" />
                <p className="text-xs text-gray-400 uppercase tracking-wider">Receita</p>
              </div>
              <p className="text-2xl font-bold text-green-400">{fmt(totalRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">{entry.routes.length} rota(s)</p>
            </div>
          </div>

          {/* Rotas do dia */}
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-100">Rotas do Dia</h2>
              <a
                href="/rotas"
                className="text-xs text-brand-400 hover:text-brand-300 transition-colors"
              >
                + Nova Rota
              </a>
            </div>
            {entry.routes.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhuma rota neste dia</p>
            ) : (
              <div className="space-y-3">
                {entry.routes.map(r => (
                  <div key={r.id} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-gray-100 font-medium">
                          {r.truck?.plate || `Caminhão #${r.truck_id}`}
                        </span>
                        <span className="text-gray-500 text-sm ml-3">
                          {r.driver?.name || `Motorista #${r.driver_id}`}
                        </span>
                      </div>
                      <span className="text-green-400 font-semibold">{fmt(r.total_revenue)}</span>
                    </div>
                    {r.helpers.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Ajudantes: {r.helpers.map(h => h.employee?.name).filter(Boolean).join(", ")}
                      </p>
                    )}
                    <div className="flex gap-4 mt-2 text-xs text-gray-400">
                      <span>{fmtN(r.total_km)} km</span>
                      {r.stops?.length > 0 && <span>{r.stops.length} parada(s)</span>}
                      {r.other_expenses?.length > 0 && (
                        <span>{fmt(r.other_expenses.reduce((s, o) => s + o.amount, 0))} extras</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Abastecimento do dia */}
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-100">Abastecimento</h2>
              <a href="/abastecimento" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                + Novo
              </a>
            </div>
            {entry.fuel.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum abastecimento neste dia</p>
            ) : (
              <div className="space-y-2">
                {entry.fuel.map(f => (
                  <div key={f.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                    <div>
                      <span className="text-gray-100 text-sm font-medium">
                        {f.truck?.plate || `Caminhão #${f.truck_id}`}
                      </span>
                      <span className="text-gray-500 text-xs ml-3">{fmtN(f.liters)} L</span>
                    </div>
                    <span className="text-yellow-400 text-sm font-medium">{fmt(f.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manutenção do dia */}
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-100">Manutenção</h2>
              <a href="/manutencao" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                + Novo
              </a>
            </div>
            {entry.maintenance.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhuma manutenção neste dia</p>
            ) : (
              <div className="space-y-2">
                {entry.maintenance.map(m => (
                  <div key={m.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                    <div className="flex-1">
                      <span className="text-gray-100 text-sm font-medium">
                        {m.truck?.plate || `Caminhão #${m.truck_id}`}
                      </span>
                      <span className="text-gray-500 text-xs ml-3">{m.description}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        m.type === "preventive"
                          ? "bg-blue-900/50 text-blue-400"
                          : "bg-red-900/50 text-red-400"
                      }`}>
                        {m.type === "preventive" ? "Preventiva" : "Corretiva"}
                      </span>
                      <span className="text-red-400 text-sm font-medium w-20 text-right">{fmt(m.cost)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {!loading && !error && !entry && (
        <p className="text-gray-500 text-sm">Selecione uma data para ver o diário de bordo</p>
      )}
    </div>
  );
}
