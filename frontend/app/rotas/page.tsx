"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, PlusCircle, XCircle, Check } from "lucide-react";
import Modal from "@/components/Modal";
import { api, BASE } from "@/lib/api";
import type { Route, Truck, Employee, Client, OtherExpenseCreate } from "@/lib/types";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "EUR" });

interface StopForm { client_id: string; value: string; notes: string; confirmed: boolean }
const emptyStop = (): StopForm => ({ client_id: "", value: "", notes: "", confirmed: false });

export default function Rotas() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Employee[]>([]);
  const [helpers, setHelpers] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Route | null>(null);
  const [error, setError] = useState("");

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [truckId, setTruckId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [helperIds, setHelperIds] = useState<string[]>([]);
  const [totalKm, setTotalKm] = useState("");
  const [totalRevenue, setTotalRevenue] = useState("");
  const [conceito, setConceito] = useState("");
  const [notes, setNotes] = useState("");
  const [stops, setStops] = useState<StopForm[]>([emptyStop()]);
  const [expenses, setExpenses] = useState<OtherExpenseCreate[]>([]);
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expCat, setExpCat] = useState("outros");

  const load = () => api.get<Route[]>("/routes/").then(setRoutes);
  useEffect(() => {
    load();
    api.get<Truck[]>("/trucks/").then(setTrucks);
    api.get<Employee[]>("/employees/?type=driver&active=true").then(setDrivers);
    api.get<Employee[]>("/employees/?type=helper&active=true").then(setHelpers);
    api.get<Client[]>("/clients/").then(setClients);
  }, []);

  const resetForm = () => {
    setDate(new Date().toISOString().slice(0, 10));
    setTruckId(""); setDriverId(""); setHelperIds([]); setTotalKm(""); setTotalRevenue(""); setConceito(""); setNotes("");
    setStops([emptyStop()]); setExpenses([]);
  };

  const openCreate = () => { setEditing(null); resetForm(); setError(""); setOpen(true); };
  const openEdit = (r: Route) => {
    setEditing(r);
    setDate(r.date ?? ""); setTruckId(String(r.truck_id)); setDriverId(String(r.driver_id));
    setHelperIds(r.helpers.map(h => String(h.employee_id)).filter(id => id && id !== "undefined" && !isNaN(Number(id))));
    setTotalKm(r.total_km != null ? String(r.total_km) : "");
    setTotalRevenue(r.total_revenue != null ? String(r.total_revenue) : "");
    setConceito(r.conceito ?? "");
    setNotes(r.notes ?? "");
    setStops(r.stops.length ? r.stops.map(s => ({ client_id: s.client_id != null ? String(s.client_id) : "", value: s.value != null ? String(s.value) : "", notes: s.notes ?? "", confirmed: true })) : [emptyStop()]);
    setError(""); setOpen(true);
  };

  const save = async () => {
    setError("");
    if (!date) { setError("Data é obrigatória"); return; }
    if (!truckId) { setError("Selecione um caminhão"); return; }
    if (!driverId) { setError("Selecione um motorista"); return; }
    const validHelperIds = helperIds.filter(id => id && id !== "undefined" && !isNaN(Number(id)));
    const parsedKm = parseFloat(totalKm) || 0;
    const parsedRevenue = parseFloat(totalRevenue) || 0;
    const body = {
      date, truck_id: +truckId, driver_id: +driverId,
      total_km: parsedKm, total_revenue: parsedRevenue,
      conceito: conceito || undefined, notes: notes || undefined,
      helper_ids: validHelperIds.map(Number),
      stops: stops.filter(s => s.value !== "" || s.client_id !== "").map((s, i) => ({
        client_id: s.client_id ? +s.client_id : undefined,
        stop_order: i + 1, value: parseFloat(s.value) || 0,
        notes: s.notes || undefined,
      })),
    };
    try {
      if (editing) await api.put(`/routes/${editing.id}`, body);
      else await api.post("/routes", body);
      setOpen(false); load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro";
      setError(msg);
      console.error("Routes save error:", msg, "Body sent:", JSON.stringify(body));
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Remover rota?")) return;
    await api.delete(`/routes/${id}`); load();
  };

  const addExpense = () => {
    if (!expDesc || !expAmount) return;
    setExpenses(e => [...e, { description: expDesc, amount: parseFloat(expAmount), category: expCat }]);
    setExpDesc(""); setExpAmount("");
  };

  const removeExpense = (idx: number) => {
    setExpenses(e => e.filter((_, i) => i !== idx));
  };

  const toggleHelper = (id: string) => {
    setHelperIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  };

  const stopsSum = stops.reduce((acc, s) => acc + (parseFloat(s.value) || 0), 0);

  const s = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-500";
  const sel = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-100">Rotas</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Nova Rota
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
              <th className="px-4 py-3 text-left">Data</th>
              <th className="px-4 py-3 text-left">Caminhão</th>
              <th className="px-4 py-3 text-left">Motorista</th>
              <th className="px-4 py-3 text-left">Ajudantes</th>
              <th className="px-4 py-3 text-right">KM</th>
              <th className="px-4 py-3 text-right">Receita</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {routes.map(r => (
              <tr key={r.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="px-4 py-3">{new Date(r.date).toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-3 font-mono text-brand-400">{r.truck?.plate || r.truck_id}</td>
                <td className="px-4 py-3">{r.driver?.name || "—"}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{r.helpers.map(h => h.employee?.name).filter(Boolean).join(", ") || "—"}</td>
                <td className="px-4 py-3 text-right text-gray-300">{Number(r.total_km).toLocaleString()} km</td>
                <td className="px-4 py-3 text-right font-semibold text-green-400">{fmt(Number(r.total_revenue))}</td>
                <td className="px-4 py-3 flex gap-2 justify-end">
                  <button onClick={() => openEdit(r)} className="text-gray-400 hover:text-brand-400">
                    <a href={`${BASE}/routes/${r.id}/invoice`} target="_blank" className="text-gray-400 hover:text-green-400 mr-2" title="Fatura">📄</a>
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => remove(r.id)} className="text-gray-400 hover:text-red-400"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
            {routes.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Nenhuma rota registrada</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title={editing ? "Editar Rota" : "Nova Rota"} onClose={() => setOpen(false)}>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Data *</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className={s} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Caminhão *</label>
                <select value={truckId} onChange={e => setTruckId(e.target.value)} className={sel}>
                  <option value="">Selecionar</option>
                  {trucks.map(t => <option key={t.id} value={t.id}>{t.plate} — {t.model}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Motorista *</label>
                <select value={driverId} onChange={e => setDriverId(e.target.value)} className={sel}>
                  <option value="">Selecionar</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">KM Rodados</label>
                <input type="number" value={totalKm} onChange={e => setTotalKm(e.target.value)} className={s} />
              </div>
            </div>

            {helpers.length > 0 && (
              <div>
                <label className="block text-xs text-gray-400 mb-2">Ajudantes</label>
                <div className="flex flex-wrap gap-2">
                  {helpers.map(h => (
                    <button key={h.id} type="button" onClick={() => toggleHelper(String(h.id))}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${helperIds.includes(String(h.id)) ? "bg-brand-600 border-brand-600 text-white" : "border-gray-600 text-gray-400 hover:border-gray-400"}`}>
                      {h.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-400">Paradas / Clientes</label>
                <button type="button" onClick={() => setStops(s => [...s, emptyStop()])} className="text-brand-400 hover:text-brand-300">
                  <PlusCircle size={16} />
                </button>
              </div>
              <div className="space-y-2">
                {stops.map((s, i) => (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <select value={s.client_id} onChange={e => setStops(ss => ss.map((x, j) => j === i ? { ...x, client_id: e.target.value } : x))} className={sel}>
                        <option value="">Cliente (opc.)</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="w-28">
                      <input type="text" inputMode="decimal" placeholder="Valor (€)" value={s.value}
                        onChange={e => setStops(ss => ss.map((x, j) => j === i ? { ...x, value: e.target.value, confirmed: false } : x))}
                        onBlur={() => setStops(ss => ss.map((x, j) => j === i ? { ...x, confirmed: !!x.value } : x))}
                        className={`w-full bg-gray-800 border rounded-lg px-2 py-1.5 text-xs text-gray-100 ${s.confirmed && s.value ? "border-green-600" : "border-gray-700"}`} />
                    </div>
                    <button type="button" title="Confirmar valor"
                      onClick={() => setStops(ss => ss.map((x, j) => j === i ? { ...x, confirmed: true } : x))}
                      className={`pb-1 transition-colors ${s.confirmed && s.value ? "text-green-400" : "text-gray-500 hover:text-green-400"}`}>
                      <Check size={14} />
                    </button>
                    <button type="button" onClick={() => setStops(ss => ss.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-400 pb-1">
                      <XCircle size={16} />
                    </button>
                  </div>
                ))}
              </div>
              {stopsSum > 0 && (
                <div className="flex items-center justify-between mt-2 px-1">
                  <span className="text-xs text-gray-400">Total das paradas: <span className="text-green-400 font-medium">{fmt(stopsSum)}</span></span>
                  <button type="button" onClick={() => setTotalRevenue(stopsSum.toFixed(2))}
                    className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                    <Check size={12} /> Usar como receita
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Receita Total (€)</label>
              <input type="number" value={totalRevenue} onChange={e => setTotalRevenue(e.target.value)} className={s} />
            </div>

            <div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Outros Gastos</label>
                <div className="flex gap-2 mb-2">
                  <input value={expDesc} onChange={e => setExpDesc(e.target.value)} placeholder="Descrição" className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-100" />
                  <input type="number" value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="€" className="w-20 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-100" />
                  <select value={expCat} onChange={e => setExpCat(e.target.value)} className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-100">
                    <option value="pedagio">Pedágio</option>
                    <option value="seguro">Seguro</option>
                    <option value="pneus">Pneus</option>
                    <option value="ajudante">Ajudante</option>
                    <option value="lavagem">Lavagem</option>
                    <option value="outros">Outros</option>
                  </select>
                  <button type="button" onClick={addExpense} className="text-brand-400 hover:text-brand-300 text-xs">+</button>
                </div>
                {expenses.length > 0 && (
                  <div className="space-y-1">
                    {expenses.map((e, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-800 rounded px-2 py-1">
                        <span className="text-xs text-gray-300">{e.description}</span>
                        <span className="text-xs text-yellow-400">€{e.amount.toFixed(2)}</span>
                        <button onClick={() => removeExpense(i)} className="text-red-400 text-xs">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <label className="block text-xs text-gray-400 mb-1">Conceito</label>
                <input value={conceito} onChange={e => setConceito(e.target.value)}
                  className={s} placeholder="Ex: Transporte Valencia-Madrid" />
              </div>

              <div className="mt-4">
                <label className="block text-xs text-gray-400 mb-1">Observações</label>
                <input value={notes} onChange={e => setNotes(e.target.value)}
                  className={s} placeholder="Notas internas" />
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button onClick={save} className="flex-1 bg-brand-600 hover:bg-brand-700 text-white py-2 rounded-lg text-sm font-medium">Salvar</button>
              <button onClick={() => setOpen(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm">Cancelar</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
