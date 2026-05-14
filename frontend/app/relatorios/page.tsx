"use client";
import { useEffect, useState } from "react";
import { api, BASE } from "@/lib/api";
import type { DashboardKPIs } from "@/lib/types";

const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "EUR" });
const fmtN = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
const pct = (val: number, total: number) => total > 0 ? ((val / total) * 100).toFixed(1) + "%" : "—";

export default function Relatorios() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get<DashboardKPIs>(`/dashboard/kpis?year=${year}&month=${month}`)
      .then(setKpis)
      .finally(() => setLoading(false));
  }, [year, month]);

  const handleExportPDF = () => {
    window.open(`${BASE}/relatorios/pdf?year=${year}&month=${month}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Relatórios</h1>
          <p className="text-gray-400 text-sm mt-0.5">Resumo financeiro mensal</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={month}
            onChange={e => setMonth(+e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100"
          >
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={year}
            onChange={e => setYear(+e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100"
          >
            {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
          </select>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Exportar PDF
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Carregando...</p>
      ) : !kpis ? (
        <p className="text-gray-500 text-sm">Erro ao carregar dados.</p>
      ) : (
        <>
          {/* Resumo financeiro */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">
              Resumo — {MONTHS[month - 1]}/{year}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat label="Receita" value={fmt(kpis.revenue)} color="text-green-400" />
              <Stat label="Custo Total" value={fmt(kpis.total_cost)} color="text-red-400" />
              <Stat
                label="Resultado"
                value={fmt(kpis.profit)}
                color={kpis.profit >= 0 ? "text-green-400" : "text-red-400"}
                sub={kpis.revenue > 0 ? pct(kpis.profit, kpis.revenue) + " margem" : undefined}
              />
              <Stat label="KM Rodados" value={fmtN(kpis.total_km) + " km"} color="text-blue-400" />
            </div>
          </div>

          {/* Breakdown de custos */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">Detalhamento de Custos</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs border-b border-gray-800">
                  <th className="text-left pb-2">Categoria</th>
                  <th className="text-right pb-2">Valor</th>
                  <th className="text-right pb-2">% do custo total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                <CostRow label="Combustível" value={kpis.fuel_cost} total={kpis.total_cost} />
                <CostRow label="Manutenção" value={kpis.maintenance_cost} total={kpis.total_cost} />
                <CostRow label="Folha de Pagamento" value={kpis.salary_cost} total={kpis.total_cost} />
                <CostRow label="Outros Gastos" value={kpis.other_costs ?? 0} total={kpis.total_cost} />
                <tr className="font-semibold text-gray-200">
                  <td className="py-2">Total</td>
                  <td className="text-right py-2">{fmt(kpis.total_cost)}</td>
                  <td className="text-right py-2">100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Indicadores operacionais */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">Indicadores Operacionais</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Stat label="Custo por KM" value={fmt(kpis.cost_per_km) + "/km"} color="text-gray-100" />
              <Stat label="Receita por KM" value={fmt(kpis.revenue_per_km) + "/km"} color="text-gray-100" />
              <Stat label="Consumo Médio" value={fmtN(kpis.avg_consumption_km_per_liter) + " km/L"} color="text-gray-100" />
              <Stat label="Combustível (litros)" value={fmtN(kpis.fuel_liters) + " L"} color="text-gray-100" />
              <Stat label="Dias Trabalhados" value={`${kpis.days_worked ?? 0} / ${kpis.total_days}`} color="text-gray-100" />
              <Stat label="Dias Parados" value={`${kpis.days_idle} dias`} color={kpis.days_idle > 10 ? "text-red-400" : "text-yellow-400"} />
            </div>
          </div>

          {/* Ponto de equilíbrio */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-2">Ponto de Equilíbrio</h2>
            <p className="text-xs text-gray-500 mb-4">Receita mínima para cobrir todos os custos do mês</p>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-2xl font-bold text-orange-400">{fmt(kpis.breakeven)}</p>
                <p className="text-xs text-gray-500 mt-1">necessário para não ter prejuízo</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-400">{fmt(kpis.revenue)}</p>
                <p className="text-xs text-gray-500 mt-1">receita realizada</p>
              </div>
              {kpis.revenue >= kpis.breakeven ? (
                <span className="px-3 py-1 bg-green-900/40 text-green-400 rounded-full text-xs font-medium">Equilíbrio atingido</span>
              ) : (
                <span className="px-3 py-1 bg-red-900/40 text-red-400 rounded-full text-xs font-medium">
                  Faltam {fmt(kpis.breakeven - kpis.revenue)}
                </span>
              )}
            </div>
          </div>

          {/* Por caminhão */}
          {kpis.revenue_by_truck.length > 0 && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <h2 className="text-sm font-semibold text-gray-300 mb-4">Desempenho por Caminhão</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs border-b border-gray-800">
                    <th className="text-left pb-2">Caminhão</th>
                    <th className="text-right pb-2">Receita</th>
                    <th className="text-right pb-2">KM</th>
                    <th className="text-right pb-2">% da Receita</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {kpis.revenue_by_truck.map(t => (
                    <tr key={t.truck_id} className="text-gray-300">
                      <td className="py-2">
                        <span className="font-medium">{t.plate}</span>
                        <span className="text-gray-500 ml-1 text-xs">{t.model}</span>
                      </td>
                      <td className="text-right py-2 text-green-400">{fmt(t.revenue)}</td>
                      <td className="text-right py-2 text-blue-400">{fmtN(t.km)} km</td>
                      <td className="text-right py-2 text-gray-400">{pct(t.revenue, kpis.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-bold mt-0.5 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function CostRow({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <tr className="text-gray-300">
      <td className="py-2">{label}</td>
      <td className="text-right py-2">{fmt(value)}</td>
      <td className="text-right py-2 text-gray-400">{pct(value, total)}</td>
    </tr>
  );
}
