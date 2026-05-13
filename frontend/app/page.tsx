"use client";
import { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
} from "recharts";
import KPICard from "@/components/KPICard";
import { api } from "@/lib/api";
import type { DashboardKPIs, EvolutionPoint } from "@/lib/types";

const MONTHS = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "EUR" });
const fmtN = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

export default function Dashboard() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [evolution, setEvolution] = useState<EvolutionPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<DashboardKPIs>(`/dashboard/kpis?year=${year}&month=${month}`),
      api.get<EvolutionPoint[]>(`/dashboard/evolution?months=6`),
    ]).then(([k, e]) => {
      setKpis(k);
      setEvolution(e);
    }).finally(() => setLoading(false));
  }, [year, month]);

  const evData = evolution.map(e => ({
    ...e,
    period: e.period.slice(5) + "/" + e.period.slice(2, 4),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Visão geral da operação</p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
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
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Carregando...</p>
      ) : kpis && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Receita" value={fmt(kpis.revenue)} color="green" />
            <KPICard label="Custo Total" value={fmt(kpis.total_cost)} color="red" />
            <KPICard
              label="Lucro / Prejuízo"
              value={fmt(kpis.profit)}
              color={kpis.profit >= 0 ? "green" : "red"}
              sub={kpis.revenue > 0 ? `${((kpis.profit / kpis.revenue) * 100).toFixed(1)}% margem` : undefined}
            />
            <KPICard label="KM Rodados" value={fmtN(kpis.total_km) + " km"} color="blue" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Combustível" value={fmt(kpis.fuel_cost)} sub={`${fmtN(kpis.fuel_liters)} L`} color="yellow" />
            <KPICard label="Manutenção" value={fmt(kpis.maintenance_cost)} color="yellow" />
            <KPICard label="Folha" value={fmt(kpis.salary_cost)} color="yellow" />
            <KPICard
              label="Consumo Médio"
              value={fmtN(kpis.avg_consumption_km_per_liter) + " km/L"}
              sub={`${fmt(kpis.cost_per_km)}/km`}
            />
          </div>

          {kpis.revenue_by_truck.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {kpis.revenue_by_truck.map(t => (
                <div key={t.truck_id} className="bg-gray-900 rounded-xl border border-gray-800 p-5">
                  <p className="text-sm font-semibold text-gray-200">{t.plate} — {t.model}</p>
                  <div className="flex gap-6 mt-3">
                    <div>
                      <p className="text-xs text-gray-500">Receita</p>
                      <p className="text-lg font-bold text-green-400">{fmt(t.revenue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">KM</p>
                      <p className="text-lg font-bold text-blue-400">{fmtN(t.km)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <p className="text-sm font-semibold text-gray-200 mb-4">Receita vs Custos (6 meses)</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={evData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="period" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="revenue" name="Receita" fill="#10b981" radius={[3,3,0,0]} />
                  <Bar dataKey="fuel_cost" name="Combustível" fill="#f59e0b" radius={[3,3,0,0]} />
                  <Bar dataKey="maintenance_cost" name="Manutenção" fill="#ef4444" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <p className="text-sm font-semibold text-gray-200 mb-4">KM Rodados (6 meses)</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={evData} margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="kmGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="period" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151" }} />
                  <Area dataKey="total_km" name="KM" stroke="#3b82f6" fill="url(#kmGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
