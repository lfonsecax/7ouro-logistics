"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Route, FuelRecord, MaintenanceRecord, Truck, Employee, Supplier } from "@/lib/types";
import { ClipboardList, Fuel, Wrench, DollarSign, Send } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "EUR" });
const fmtN = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

export default function DiarioBordo() {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [fuel, setFuel] = useState<FuelRecord[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Employee[]>([]);
  const [helpers, setHelpers] = useState<Employee[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Form state — Rota
  const [rTruck, setRTruck] = useState("");
  const [rDriver, setRDriver] = useState("");
  const [rKm, setRKm] = useState("");
  const [rRevenue, setRRevenue] = useState("");

  // Form state — Abastecimento
  const [fTruck, setFTruck] = useState("");
  const [fLiters, setFLiters] = useState("");
  const [fPrice, setFPrice] = useState("");
  const [fTotal, setFTotal] = useState(0);
  const [fSupplier, setFSupplier] = useState("");

  // Form state — Manutenção
  const [mTruck, setMTruck] = useState("");
  const [mType, setMType] = useState<"preventive" | "corrective">("preventive");
  const [mDesc, setMDesc] = useState("");
  const [mCost, setMCost] = useState("");
  const [mSupplier, setMSupplier] = useState("");

  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<Route[]>(`/routes/?date_from=${selectedDate}&date_to=${selectedDate}`),
      api.get<FuelRecord[]>(`/fuel/?date_from=${selectedDate}&date_to=${selectedDate}`),
      api.get<MaintenanceRecord[]>(`/maintenance/?date_from=${selectedDate}&date_to=${selectedDate}`),
      api.get<Truck[]>("/trucks/"),
      api.get<Employee[]>("/employees/"),
      api.get<Supplier[]>("/suppliers/"),
    ])
      .then(([r, f, m, t, e, s]) => {
        setRoutes(r); setFuel(f); setMaintenance(m);
        setTrucks(t);
        setDrivers(e.filter((e) => e.type === "driver"));
        setHelpers(e.filter((e) => e.type === "helper"));
        setSuppliers(s);
      })
      .catch((err: Error) => setMsg({ type: "err", text: err.message }))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  // Auto-calc fuel total
  useEffect(() => {
    const l = parseFloat(fLiters) || 0;
    const p = parseFloat(fPrice) || 0;
    setFTotal(l * p);
  }, [fLiters, fPrice]);

  const totalRevenue = routes.reduce((s, r) => s + (r.total_revenue || 0), 0);
  const totalFuel = fuel.reduce((s, f) => s + (f.total || 0), 0);
  const totalMaint = maintenance.reduce((s, m) => s + (m.cost || 0), 0);
  const totalKm = routes.reduce((s, r) => s + (r.total_km || 0), 0);

  async function saveRoute() {
    if (!rTruck || !rDriver) { setMsg({ type: "err", text: "Selecione caminhão e motorista" }); return; }
    setSaving("rota"); setMsg(null);
    try {
      await api.post("/routes/", {
        date: selectedDate, truck_id: +rTruck, driver_id: +rDriver,
        total_km: +rKm || 0, total_revenue: +rRevenue || 0, helper_ids: [], stops: [],
      });
      setRTruck(""); setRDriver(""); setRKm(""); setRRevenue("");
      const r = await api.get<Route[]>(`/routes/?date_from=${selectedDate}&date_to=${selectedDate}`);
      setRoutes(r);
      setMsg({ type: "ok", text: "Rota salva!" });
    } catch (e: any) { setMsg({ type: "err", text: e.message }); }
    finally { setSaving(null); }
  }

  async function saveFuel() {
    if (!fTruck || !fLiters) { setMsg({ type: "err", text: "Preencha caminhão e litros" }); return; }
    setSaving("fuel"); setMsg(null);
    try {
      await api.post("/fuel/", {
        date: selectedDate, truck_id: +fTruck, liters: +fLiters,
        price_per_liter: +fPrice || 0, total: fTotal,
        supplier_id: fSupplier ? +fSupplier : null,
      });
      setFTruck(""); setFLiters(""); setFPrice(""); setFSupplier("");
      const f = await api.get<FuelRecord[]>(`/fuel/?date_from=${selectedDate}&date_to=${selectedDate}`);
      setFuel(f);
      setMsg({ type: "ok", text: "Abastecimento salvo!" });
    } catch (e: any) { setMsg({ type: "err", text: e.message }); }
    finally { setSaving(null); }
  }

  async function saveMaintenance() {
    if (!mTruck || !mDesc || !mCost) { setMsg({ type: "err", text: "Preencha caminhão, descrição e custo" }); return; }
    setSaving("maint"); setMsg(null);
    try {
      await api.post("/maintenance/", {
        date: selectedDate, truck_id: +mTruck, type: mType,
        description: mDesc, cost: +mCost,
        supplier_id: mSupplier ? +mSupplier : null,
      });
      setMTruck(""); setMDesc(""); setMCost(""); setMType("preventive"); setMSupplier("");
      const m = await api.get<MaintenanceRecord[]>(`/maintenance/?date_from=${selectedDate}&date_to=${selectedDate}`);
      setMaintenance(m);
      setMsg({ type: "ok", text: "Manutenção salva!" });
    } catch (e: any) { setMsg({ type: "err", text: e.message }); }
    finally { setSaving(null); }
  }

  const s = "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 w-full focus:outline-none focus:border-brand-500 transition-colors";
  const label = "text-xs text-gray-400 uppercase tracking-wider mb-1";

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Diário de Bordo</h1>
          <p className="text-gray-400 text-sm mt-0.5">Registra tudo que aconteceu no dia</p>
        </div>
        <input type="date" value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100" />
      </div>

      {/* Mensagem */}
      {msg && (
        <div className={`text-sm px-4 py-2 rounded-lg ${msg.type === "ok" ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>
          {msg.text}
        </div>
      )}

      {/* Resumo do dia */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-900/40 to-gray-900 rounded-xl border border-blue-800/30 p-4">
          <div className="flex items-center gap-2 mb-1"><ClipboardList size={14} className="text-blue-400" /><p className="text-xs text-gray-400 uppercase tracking-wider">Rotas</p></div>
          <p className="text-2xl font-bold text-blue-400">{routes.length}</p>
          {totalKm > 0 && <p className="text-xs text-gray-500">{fmtN(totalKm)} km</p>}
        </div>
        <div className="bg-gradient-to-br from-yellow-900/40 to-gray-900 rounded-xl border border-yellow-800/30 p-4">
          <div className="flex items-center gap-2 mb-1"><Fuel size={14} className="text-yellow-400" /><p className="text-xs text-gray-400 uppercase tracking-wider">Combustível</p></div>
          <p className="text-2xl font-bold text-yellow-400">{fmt(totalFuel)}</p>
          <p className="text-xs text-gray-500">{fuel.length} abastecimento(s)</p>
        </div>
        <div className="bg-gradient-to-br from-red-900/40 to-gray-900 rounded-xl border border-red-800/30 p-4">
          <div className="flex items-center gap-2 mb-1"><Wrench size={14} className="text-red-400" /><p className="text-xs text-gray-400 uppercase tracking-wider">Manutenção</p></div>
          <p className="text-2xl font-bold text-red-400">{fmt(totalMaint)}</p>
          <p className="text-xs text-gray-500">{maintenance.length} registo(s)</p>
        </div>
        <div className="bg-gradient-to-br from-green-900/40 to-gray-900 rounded-xl border border-green-800/30 p-4">
          <div className="flex items-center gap-2 mb-1"><DollarSign size={14} className="text-green-400" /><p className="text-xs text-gray-400 uppercase tracking-wider">Receita</p></div>
          <p className="text-2xl font-bold text-green-400">{fmt(totalRevenue)}</p>
          <p className="text-xs text-gray-500">{routes.length} rota(s)</p>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Carregando...</p>
      ) : (
        <>
          {/* === ROTA === */}
          <div className="bg-gray-900 rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
              <ClipboardList size={16} className="text-blue-400" /> Nova Rota
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <p className={label}>Caminhão</p>
                <select value={rTruck} onChange={(e) => setRTruck(e.target.value)} className={s}>
                  <option value="">Selecionar</option>
                  {trucks.map((t) => <option key={t.id} value={t.id}>{t.plate} - {t.model}</option>)}
                </select>
              </div>
              <div>
                <p className={label}>Motorista</p>
                <select value={rDriver} onChange={(e) => setRDriver(e.target.value)} className={s}>
                  <option value="">Selecionar</option>
                  {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <p className={label}>KM</p>
                <input type="number" value={rKm} onChange={(e) => setRKm(e.target.value)} className={s} placeholder="0" />
              </div>
              <div>
                <p className={label}>Receita (€)</p>
                <input type="number" value={rRevenue} onChange={(e) => setRRevenue(e.target.value)} className={s} placeholder="0,00" />
              </div>
            </div>
            <button onClick={saveRoute} disabled={saving === "rota"}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              {saving === "rota" ? "Salvando..." : <><Send size={14} /> Salvar Rota</>}
            </button>

            {routes.length > 0 && (
              <div className="border-t border-gray-800 pt-3 mt-3 space-y-2">
                <p className="text-xs text-gray-500 uppercase">Rotas de hoje ({routes.length})</p>
                {routes.map((r) => (
                  <div key={r.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2 text-sm">
                    <span className="text-gray-100">{r.truck?.plate || `#${r.truck_id}`} — {r.driver?.name || `#${r.driver_id}`}</span>
                    <span className="text-green-400">{fmt(r.total_revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* === ABASTECIMENTO === */}
          <div className="bg-gray-900 rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
              <Fuel size={16} className="text-yellow-400" /> Abastecimento
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <p className={label}>Caminhão</p>
                <select value={fTruck} onChange={(e) => setFTruck(e.target.value)} className={s}>
                  <option value="">Selecionar</option>
                  {trucks.map((t) => <option key={t.id} value={t.id}>{t.plate} - {t.model}</option>)}
                </select>
              </div>
              <div>
                <p className={label}>Litros</p>
                <input type="number" value={fLiters} onChange={(e) => setFLiters(e.target.value)} className={s} placeholder="0" step="0.1" />
              </div>
              <div>
                <p className={label}>Preço/L (€)</p>
                <input type="number" value={fPrice} onChange={(e) => setFPrice(e.target.value)} className={s} placeholder="0,000" step="0.001" />
              </div>
              <div>
                <p className={label}>Total (€)</p>
                <input type="text" value={fmt(fTotal)} disabled className={`${s} opacity-70`} />
              </div>
            </div>
            <button onClick={saveFuel} disabled={saving === "fuel"}
              className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              {saving === "fuel" ? "Salvando..." : <><Send size={14} /> Salvar Abastecimento</>}
            </button>

            {fuel.length > 0 && (
              <div className="border-t border-gray-800 pt-3 mt-3 space-y-2">
                <p className="text-xs text-gray-500 uppercase">Abastecimentos de hoje ({fuel.length})</p>
                {fuel.map((f) => (
                  <div key={f.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2 text-sm">
                    <span className="text-gray-100">{f.truck?.plate || `#${f.truck_id}`} — {fmtN(f.liters)} L</span>
                    <span className="text-yellow-400">{fmt(f.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* === MANUTENÇÃO === */}
          <div className="bg-gray-900 rounded-xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
              <Wrench size={16} className="text-red-400" /> Manutenção
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <p className={label}>Caminhão</p>
                <select value={mTruck} onChange={(e) => setMTruck(e.target.value)} className={s}>
                  <option value="">Selecionar</option>
                  {trucks.map((t) => <option key={t.id} value={t.id}>{t.plate} - {t.model}</option>)}
                </select>
              </div>
              <div>
                <p className={label}>Tipo</p>
                <select value={mType} onChange={(e) => setMType(e.target.value as "preventive" | "corrective")} className={s}>
                  <option value="preventive">Preventiva</option>
                  <option value="corrective">Corretiva</option>
                </select>
              </div>
              <div>
                <p className={label}>Descrição</p>
                <input type="text" value={mDesc} onChange={(e) => setMDesc(e.target.value)} className={s} placeholder="O quê foi feito?" />
              </div>
              <div>
                <p className={label}>Custo (€)</p>
                <input type="number" value={mCost} onChange={(e) => setMCost(e.target.value)} className={s} placeholder="0,00" step="0.01" />
              </div>
            </div>
            <button onClick={saveMaintenance} disabled={saving === "maint"}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              {saving === "maint" ? "Salvando..." : <><Send size={14} /> Salvar Manutenção</>}
            </button>

            {maintenance.length > 0 && (
              <div className="border-t border-gray-800 pt-3 mt-3 space-y-2">
                <p className="text-xs text-gray-500 uppercase">Manutenções de hoje ({maintenance.length})</p>
                {maintenance.map((m) => (
                  <div key={m.id} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-100">{m.truck?.plate || `#${m.truck_id}`}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${m.type === "preventive" ? "bg-blue-900/50 text-blue-400" : "bg-red-900/50 text-red-400"}`}>
                        {m.type === "preventive" ? "Prev" : "Corr"}
                      </span>
                      <span className="text-gray-400">{m.description}</span>
                    </div>
                    <span className="text-red-400">{fmt(m.cost)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
