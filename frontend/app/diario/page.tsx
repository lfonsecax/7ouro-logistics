"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Route, FuelRecord, MaintenanceRecord, Truck, Employee, Client, Supplier } from "@/lib/types";
import { ClipboardList, Fuel, Wrench, DollarSign, Send, Plus, X, MapPin } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "EUR" });
const fmtN = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

interface StopForm { client_id: string; value: string }
interface OtherForm { description: string; amount: string }

export default function DiarioBordo() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Employee[]>([]);
  const [allEmps, setAllEmps] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [fuelRecs, setFuelRecs] = useState<FuelRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // --- Form fields ---
  const [truckId, setTruckId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [km, setKm] = useState("");
  const [revenue, setRevenue] = useState("");
  const [conceito, setConceito] = useState("");
  const [helperIds, setHelperIds] = useState<number[]>([]);
  const [mealCost, setMealCost] = useState("");

  // Cliente (parada única simplificada)
  const [clientId, setClientId] = useState("");

  // Abastecimento (opcional)
  const [fuelLiters, setFuelLiters] = useState("");
  const [fuelPrice, setFuelPrice] = useState("");
  const [fuelTotal, setFuelTotal] = useState(0);
  const [fuelSupplier, setFuelSupplier] = useState("");

  // Manutenção (opcional)
  const [maintType, setMaintType] = useState<"preventive" | "corrective">("preventive");
  const [maintDesc, setMaintDesc] = useState("");
  const [maintCost, setMaintCost] = useState("");

  // Outros gastos
  const [otherExpenses, setOtherExpenses] = useState<OtherForm[]>([]);

  // Auto-calc fuel
  useEffect(() => {
    setFuelTotal((parseFloat(fuelLiters) || 0) * (parseFloat(fuelPrice) || 0));
  }, [fuelLiters, fuelPrice]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<Truck[]>("/trucks/"),
      api.get<Employee[]>("/employees/"),
      api.get<Client[]>("/clients/"),
      api.get<Supplier[]>("/suppliers/"),
    ]).then(([t, e, c, s]) => {
      setTrucks(t); setAllEmps(e);
      setDrivers(e.filter((x) => x.type === "driver"));
      setClients(c); setSuppliers(s);
    }).catch((e) => setMsg({ ok: false, text: e.message }))
    .finally(() => setLoading(false));
  }, []);

  function loadDay(d: string) {
    setLoading(true);
    Promise.all([
      api.get<Route[]>(`/routes/?date_from=${d}&date_to=${d}`),
      api.get<FuelRecord[]>(`/fuel/?date_from=${d}&date_to=${d}`),
    ]).then(([r, f]) => { setRoutes(r); setFuelRecs(f); })
    .catch((e) => setMsg({ ok: false, text: e.message }))
    .finally(() => setLoading(false));
  }

  useEffect(() => { loadDay(date); }, [date]);

  function toggleHelper(id: number) {
    setHelperIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function clearForm() {
    setTruckId(""); setDriverId(""); setKm(""); setRevenue(""); setConceito(""); setHelperIds([]); setMealCost("");
    setClientId(""); setFuelLiters(""); setFuelPrice(""); setFuelSupplier("");
    setMaintType("preventive"); setMaintDesc(""); setMaintCost("");
    setOtherExpenses([]);
  }

  async function handleSave() {
    if (!truckId || !driverId) {
      setMsg({ ok: false, text: "Seleciona caminhão e motorista" }); return;
    }
    setSaving(true); setMsg(null);
    try {
      // 1) Cria a rota
      const selectedHelpers = allEmps.filter(h => helperIds.includes(h.id));
      const helperCost = selectedHelpers.reduce((sum, h) => sum + (+(h.daily_rate ?? 0) || 0), 0);
      const routeData: any = {
        date, truck_id: +truckId, driver_id: +driverId,
        total_km: +km || 0, total_revenue: +revenue || 0,
        helper_cost: helperCost, meal_cost: +mealCost || 0,
        conceito: conceito || undefined,
        helper_ids: helperIds,
        stops: clientId ? [{ client_id: +clientId, stop_order: 1, value: +revenue || 0 }] : [],
      };
      if (otherExpenses.length > 0) {
        routeData.other_expenses = otherExpenses
          .filter((o) => o.description && o.amount)
          .map((o) => ({ description: o.description, amount: +o.amount, category: "outros" }));
      }
      await api.post("/routes/", routeData);

      // 2) Abastecimento (se preencheu)
      if (fuelLiters && parseFloat(fuelLiters) > 0) {
        await api.post("/fuel/", {
          date, truck_id: +truckId, liters: +fuelLiters,
          price_per_liter: +fuelPrice || 0, total: fuelTotal,
          supplier_id: fuelSupplier ? +fuelSupplier : null,
        });
      }

      // 3) Manutenção (se preencheu)
      if (maintDesc && maintCost) {
        await api.post("/maintenance/", {
          date, truck_id: +truckId, type: maintType,
          description: maintDesc, cost: +maintCost,
        });
      }

      setMsg({ ok: true, text: "Registo salvo com sucesso!" });
      clearForm();
      loadDay(date);
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setSaving(false);
    }
  }

  const s = "bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 w-full focus:outline-none focus:border-brand-500 transition-colors";
  const l = "text-xs text-gray-400 uppercase tracking-wider mb-0.5";

  const totalKm = routes.reduce((s, r) => s + (r.total_km || 0), 0);
  const totalRev = routes.reduce((s, r) => s + (r.total_revenue || 0), 0);
  const totalFuelVal = fuelRecs.reduce((s, f) => s + (f.total || 0), 0);

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Cabeçalho + data */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Diário de Bordo</h1>
          <p className="text-gray-400 text-sm">Tudo num formulário só</p>
        </div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100" />
      </div>

      {msg && (
        <div className={`text-sm px-4 py-2 rounded-lg flex items-center justify-between ${
          msg.ok ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"
        }`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="opacity-60 hover:opacity-100">&times;</button>
        </div>
      )}

      {/* Resumo rápido do dia */}
      {!loading && (routes.length > 0 || fuelRecs.length > 0) && (
        <div className="flex gap-4 text-sm">
          <span className="text-blue-400">{routes.length} rota(s) · {fmtN(totalKm)} km</span>
          <span className="text-yellow-400">{fmt(totalFuelVal)} combustível</span>
          <span className="text-green-400">{fmt(totalRev)} receita</span>
        </div>
      )}

      {/* === FORMULÁRIO ÚNICO === */}
      <div className="bg-gray-900 rounded-xl p-5 space-y-5 border border-gray-800">

        {/* -- Linha 1: Caminhão + Motorista -- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p className={l}>Caminhão</p>
            <select value={truckId} onChange={(e) => setTruckId(e.target.value)} className={s}>
              <option value="">Selecionar caminhão</option>
              {trucks.map((t) => <option key={t.id} value={t.id}>{t.plate} — {t.model}</option>)}
            </select>
          </div>
          <div>
            <p className={l}>Motorista</p>
            <select value={driverId} onChange={(e) => setDriverId(e.target.value)} className={s}>
              <option value="">Selecionar motorista</option>
              {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        {/* -- Linha 2: KM + Receita + Cliente -- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <p className={l}>KM Rodados</p>
            <input type="number" value={km} onChange={(e) => setKm(e.target.value)}
              className={s} placeholder="0" min="0" />
          </div>
          <div>
            <p className={l}>Valor da Rota (€)</p>
            <input type="number" value={revenue} onChange={(e) => setRevenue(e.target.value)}
              className={s} placeholder="0,00" step="0.01" min="0" />
          </div>
          <div>
            <p className={l}>Cliente</p>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={s}>
              <option value="">Nenhum</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        {/* -- Conceito -- */}
        <div>
          <p className={l}>Conceito</p>
          <input type="text" value={conceito} onChange={(e) => setConceito(e.target.value)}
            className={s} placeholder="Ex: Transporte de mercadorias - Valencia a Madrid" />
        </div>

        {/* -- Alimentação -- */}
        <div>
          <p className={l}>Alimentação (€)</p>
          <input type="number" value={mealCost} onChange={(e) => setMealCost(e.target.value)}
            className={s} placeholder="0,00" step="0.1" min="0" />
        </div>

        {/* -- Ajudantes -- */}
        <div>
          <p className={l}>Ajudantes</p>
          {allEmps.filter((e) => e.type === "helper").length === 0 ? (
            <p className="text-xs text-gray-500 mt-1">Nenhum ajudante registado</p>
          ) : (
            <>
            <div className="flex flex-wrap gap-2 mt-1">
              {allEmps.filter((e) => e.type === "helper").map((h) => (
                <button key={h.id} onClick={() => toggleHelper(h.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    helperIds.includes(h.id)
                      ? "bg-brand-600 border-brand-500 text-white"
                      : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600"
                  }`}>
                  {h.name} {h.daily_rate ? `(${h.daily_rate}€)` : ""}
                </button>
              ))}
            </div>
            {helperIds.length > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                Custo ajudantes: <span className="text-yellow-400 font-medium">
                  {allEmps.filter(h => helperIds.includes(h.id)).reduce((s, h) => s + (+(h.daily_rate ?? 0) || 0), 0).toFixed(2)}€
                </span> ({helperIds.length} × diária)
              </p>
            )}
            </>
          )}
        </div>

        <hr className="border-gray-800" />

        {/* -- Abastecimento (opcional) -- */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Fuel size={14} className="text-yellow-400" />
            <span className="text-sm font-medium text-gray-200">Abastecimento <span className="text-gray-500 font-normal">(opcional)</span></span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <p className={l}>Litros</p>
              <input type="number" value={fuelLiters} onChange={(e) => setFuelLiters(e.target.value)}
                className={s} placeholder="0" step="0.1" min="0" />
            </div>
            <div>
              <p className={l}>Preço/L (€)</p>
              <input type="number" value={fuelPrice} onChange={(e) => setFuelPrice(e.target.value)}
                className={s} placeholder="0,000" step="0.001" min="0" />
            </div>
            <div>
              <p className={l}>Total</p>
              <input type="text" value={fuelTotal > 0 ? fmt(fuelTotal) : "—"} disabled
                className={`${s} opacity-60`} />
            </div>
            <div>
              <p className={l}>Fornecedor</p>
              <select value={fuelSupplier} onChange={(e) => setFuelSupplier(e.target.value)} className={s}>
                <option value="">—</option>
                {suppliers.map((sp) => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* -- Manutenção (opcional) -- */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Wrench size={14} className="text-red-400" />
            <span className="text-sm font-medium text-gray-200">Manutenção <span className="text-gray-500 font-normal">(opcional)</span></span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <p className={l}>Tipo</p>
              <select value={maintType} onChange={(e) => setMaintType(e.target.value as any)} className={s}>
                <option value="preventive">Preventiva</option>
                <option value="corrective">Corretiva</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <p className={l}>Descrição</p>
              <input type="text" value={maintDesc} onChange={(e) => setMaintDesc(e.target.value)}
                className={s} placeholder="O que foi feito?" />
            </div>
            <div>
              <p className={l}>Custo (€)</p>
              <input type="number" value={maintCost} onChange={(e) => setMaintCost(e.target.value)}
                className={s} placeholder="0,00" step="0.01" min="0" />
            </div>
          </div>
        </div>

        {/* -- Outros Gastos -- */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <DollarSign size={14} className="text-purple-400" />
              <span className="text-sm font-medium text-gray-200">Outros Gastos <span className="text-gray-500 font-normal">(opcional)</span></span>
            </div>
            <button onClick={() => setOtherExpenses((p) => [...p, { description: "", amount: "" }])}
              className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              <Plus size={12} /> Adicionar
            </button>
          </div>
          {otherExpenses.map((o, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
              <div className="sm:col-span-2">
                <input type="text" value={o.description} onChange={(e) => {
                  const copy = [...otherExpenses]; copy[i].description = e.target.value; setOtherExpenses(copy);
                }} className={s} placeholder="Descrição" />
              </div>
              <div className="flex gap-2">
                <input type="number" value={o.amount} onChange={(e) => {
                  const copy = [...otherExpenses]; copy[i].amount = e.target.value; setOtherExpenses(copy);
                }} className={s} placeholder="Valor" step="0.01" />
                <button onClick={() => setOtherExpenses((p) => p.filter((_, j) => j !== i))}
                  className="text-gray-500 hover:text-red-400 transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* -- Botão Salvar -- */}
        <button onClick={handleSave} disabled={saving || !truckId || !driverId}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-semibold py-3 rounded-lg transition-colors text-sm">
          {saving ? (
            "Salvando..."
          ) : (
            <><Send size={16} /> Registar Diário de Bordo</>
          )}
        </button>
      </div>

      {/* Histórico do dia */}
      {loading ? (
        <p className="text-gray-500 text-sm text-center py-4">Carregando...</p>
      ) : routes.length === 0 && fuelRecs.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">Nenhum registo para este dia</p>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Registos de {new Date(date).toLocaleDateString("pt-BR")}</p>

          {routes.map((r) => (
            <div key={r.id} className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ClipboardList size={14} className="text-blue-400" />
                  <span className="text-gray-100 font-medium">{r.truck?.plate || `#${r.truck_id}`}</span>
                  <span className="text-gray-500 text-sm">{r.driver?.name}</span>
                </div>
                <span className="text-green-400 font-semibold text-sm">{fmt(r.total_revenue)}</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                <span>{fmtN(r.total_km)} km</span>
                {r.stops?.[0]?.client?.name && <span className="flex items-center gap-1"><MapPin size={10} />{r.stops[0].client.name}</span>}
                {r.helpers?.map((h) => h.employee?.name).filter(Boolean).join(", ") && (
                  <span>🙋 {r.helpers.map((h) => h.employee?.name).join(", ")}</span>
                )}
              </div>
            </div>
          ))}

          {fuelRecs.map((f) => (
            <div key={`f-${f.id}`} className="bg-gray-900 rounded-lg p-4 border border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Fuel size={14} className="text-yellow-400" />
                <span className="text-gray-100 text-sm font-medium">{f.truck?.plate || `#${f.truck_id}`}</span>
                <span className="text-gray-500 text-sm">{fmtN(f.liters)} L</span>
              </div>
              <span className="text-yellow-400 text-sm font-medium">{fmt(f.total)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
