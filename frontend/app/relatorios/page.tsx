"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { DashboardKPIs, EvolutionPoint } from "@/lib/types";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dev"];
const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "EUR" });
const fmtN = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

export default function Relatorios() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [evolution, setEvolution] = useState<EvolutionPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      api.get<DashboardKPIs>(`/dashboard/kpis?year=${year}&month=${today.getMonth() + 1}`),
      api.get<EvolutionPoint[]>(`/dashboard/evolution?months=12`),
    ])
      .then(([k, e]) => {
        setKpis(k);
        setEvolution(e);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [year]);

  if (loading) return <p className="text-gray-500 text-sm">Carregando...</p>;
  if (error) return <p className="text-red-400 text-sm">Erro: {error}</p>;
  if (!kpis) return <p className="text-gray-500 text-sm">Nenhum dado disponível</p>;

  const evData = evolution.map(e => ({
    ...e,
    period: e.period.slice(5) + "/" + e.period.slice(2, 4),
  }));

  const totalRevenue = evolution.reduce((s, e) => s + e.revenue, 0);
  const totalFuel = evolution.reduce((s, e) => s + e.fuel_cost, 0);
  const totalMaint = evolution.reduce((s, e) => s + e.maintenance_cost, 0);
  const totalHelper = evolution.reduce((s, e) => s + e.helper_cost, 0);
  const totalMeal = evolution.reduce((s, e) => s + e.meal_cost, 0);
  const totalOther = evolution.reduce((s, e) => s + e.other_costs, 0);
  const totalKm = evolution.reduce((s, e) => s + e.total_km, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Relatórios</h1>
          <p className="text-gray-400 text-sm mt-0.5">Visão consolidada da operação</p>
        </div>
        <select
          value={year}
          onChange={e => setYear(+e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100"
        >
          {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
        </select>
      </div>

      {/* Resumo anual */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-gray-900 rounded-xl border-l-4 border-blue-500 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Receita Total</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{fmt(totalRevenue)}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border-l-4 border-yellow-500 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Combustível</p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">{fmt(totalFuel)}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border-l-4 border-red-500 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Manutenção</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{fmt(totalMaint)}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border-l-4 border-purple-500 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Outros Custos</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{fmt(totalOther)}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border-l-4 border-orange-500 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Ajudantes</p>
          <p className="text-2xl font-bold text-orange-400 mt-1">{fmt(totalHelper)}</p>
        </div>
        <div className="bg-gray-900 rounded-xl border-l-4 border-green-500 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">KM Total</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{fmtN(totalKm)} km</p>
        </div>
      </div>

      {/* Gráfico Receita vs Custos */}
      <div className="bg-gray-900 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Receita vs Custos (12 meses)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={evData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="period" stroke="#9CA3AF" fontSize={12} />
            <YAxis stroke="#9CA3AF" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: 8 }}
              labelStyle={{ color: "#F3F4F6" }}
            />
            <Legend />
            <Bar dataKey="revenue" name="Receita" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="fuel_cost" name="Combustível" fill="#EAB308" radius={[4, 4, 0, 0]} />
            <Bar dataKey="maintenance_cost" name="Manutenção" fill="#EF4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="other_costs" name="Outros Custos" fill="#A855F7" radius={[4, 4, 0, 0]} />
            <Bar dataKey="helper_cost" name="Ajudantes" fill="#F97316" radius={[4, 4, 0, 0]} />
            <Bar dataKey="meal_cost" name="Alimentação" fill="#10B981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* KM mensal */}
      <div className="bg-gray-900 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">KM Rodados (12 meses)</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={evData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="period" stroke="#9CA3AF" fontSize={12} />
            <YAxis stroke="#9CA3AF" fontSize={12} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: 8 }}
              labelStyle={{ color: "#F3F4F6" }}
            />
            <Legend />
            <Line type="monotone" dataKey="total_km" name="KM" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela mensal */}
      <div className="bg-gray-900 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Detalhamento Mensal</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left py-3 px-2">Mês</th>
                <th className="text-right py-3 px-2">Receita</th>
                <th className="text-right py-3 px-2">Combustível</th>
                <th className="text-right py-3 px-2">Manutenção</th>
                <th className="text-right py-3 px-2">Ajudantes</th>
                <th className="text-right py-3 px-2">Aliment.</th>
                <th className="text-right py-3 px-2">Outros</th>
                <th className="text-right py-3 px-2">KM</th>
              </tr>
            </thead>
            <tbody>
              {evolution.map(e => (
                <tr key={e.period} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-2 text-gray-100 font-medium">
                    {e.period.slice(5)}/{e.period.slice(2, 4)}
                  </td>
                  <td className="py-3 px-2 text-right text-blue-400">{fmt(e.revenue)}</td>
                  <td className="py-3 px-2 text-right text-yellow-400">{fmt(e.fuel_cost)}</td>
                  <td className="py-3 px-2 text-right text-red-400">{fmt(e.maintenance_cost)}</td>
                  <td className="py-3 px-2 text-right text-orange-400">{fmt(e.helper_cost)}</td>
                  <td className="py-3 px-2 text-right text-green-400">{fmt(e.meal_cost)}</td>
                  <td className="py-3 px-2 text-right text-purple-400">{fmt(e.other_costs)}</td>
                  <td className="py-3 px-2 text-right text-gray-100">{fmtN(e.total_km)} km</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Indicadores do mês atual */}
      <div className="bg-gray-900 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Indicadores — {MONTHS[today.getMonth()]}/{year}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-400">Custo por KM</p>
            <p className="text-xl font-bold text-orange-400">{fmt(kpis.cost_per_km)}/km</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-400">Consumo Médio</p>
            <p className="text-xl font-bold text-blue-400">{fmtN(kpis.avg_consumption_km_per_liter)} km/L</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-400">Dias Parados</p>
            <p className="text-xl font-bold text-red-400">{kpis.days_idle}/{kpis.total_days} dias</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-400">Ponto de Equilíbrio</p>
            <p className="text-xl font-bold text-orange-400">{fmt(kpis.breakeven)}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-400">Margem</p>
            <p className={`text-xl font-bold ${kpis.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
              {kpis.revenue > 0 ? ((kpis.profit / kpis.revenue) * 100).toFixed(1) : "0.0"}%
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-xs text-gray-400">Receita por KM</p>
            <p className="text-xl font-bold text-green-400">{fmt(kpis.revenue_per_km)}/km</p>
          </div>
        </div>
      </div>
    </div>
  );
}
