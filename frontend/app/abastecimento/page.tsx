"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Modal from "@/components/Modal";
import { api } from "@/lib/api";
import type { FuelRecord, Truck, Supplier } from "@/lib/types";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "EUR" });
const EMPTY = { date: "", truck_id: "", supplier_id: "", liters: "", price_per_liter: "", total: "", odometer: "", notes: "" };

export default function Abastecimento() {
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FuelRecord | null>(null);
  const [form, setForm] = useState<Record<string, string>>(EMPTY);
  const [error, setError] = useState("");

  const load = () => api.get<FuelRecord[]>("/fuel/").then(setRecords);
  useEffect(() => {
    load();
    api.get<Truck[]>("/trucks/").then(setTrucks);
    api.get<Supplier[]>("/suppliers/?type=gas_station").then(setSuppliers);
  }, []);

  const openCreate = () => {
    const today = new Date().toISOString().slice(0, 10);
    setEditing(null); setForm({ ...EMPTY, date: today }); setError(""); setOpen(true);
  };
  const openEdit = (r: FuelRecord) => {
    setEditing(r);
    setForm({ date: r.date, truck_id: String(r.truck_id), supplier_id: String(r.supplier_id||""), liters: String(r.liters), price_per_liter: String(r.price_per_liter||""), total: String(r.total), odometer: String(r.odometer||""), notes: r.notes||"" });
    setError(""); setOpen(true);
  };

  const save = async () => {
    setError("");
    const body = {
      date: form.date,
      truck_id: +form.truck_id,
      supplier_id: form.supplier_id ? +form.supplier_id : undefined,
      liters: +form.liters,
      price_per_liter: form.price_per_liter ? +form.price_per_liter : undefined,
      total: +form.total,
      odometer: form.odometer ? +form.odometer : undefined,
      notes: form.notes || undefined,
    };
    try {
      if (editing) await api.put(`/fuel/${editing.id}`, body);
      else await api.post("/fuel/", body);
      setOpen(false); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Erro"); }
  };

  const remove = async (id: number) => {
    if (!confirm("Remover registro?")) return;
    await api.delete(`/fuel/${id}`); load();
  };

  const calcTotal = (liters: string, ppl: string) => {
    const l = parseFloat(liters), p = parseFloat(ppl);
    if (!isNaN(l) && !isNaN(p)) setForm(f => ({ ...f, total: (l * p).toFixed(2) }));
  };

  const field = (k: string, label: string, type = "text") => (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input type={type} value={form[k]} onChange={e => {
        const v = e.target.value;
        setForm(f => ({ ...f, [k]: v }));
        if (k === "liters") calcTotal(v, form.price_per_liter);
        if (k === "price_per_liter") calcTotal(form.liters, v);
      }}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-500" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-100">Abastecimento</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Registrar
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
              <th className="px-4 py-3 text-left">Data</th>
              <th className="px-4 py-3 text-left">Caminhão</th>
              <th className="px-4 py-3 text-left">Posto</th>
              <th className="px-4 py-3 text-right">Litros</th>
              <th className="px-4 py-3 text-right">Preço/L</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Hodômetro</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="px-4 py-3">{new Date(r.date).toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-3 font-mono text-brand-400">{r.truck?.plate || r.truck_id}</td>
                <td className="px-4 py-3 text-gray-400">{r.supplier?.name || "—"}</td>
                <td className="px-4 py-3 text-right">{Number(r.liters).toFixed(1)} L</td>
                <td className="px-4 py-3 text-right text-gray-400">{r.price_per_liter ? fmt(Number(r.price_per_liter)) : "—"}</td>
                <td className="px-4 py-3 text-right font-semibold">{fmt(Number(r.total))}</td>
                <td className="px-4 py-3 text-right text-gray-400">{r.odometer ? `${Number(r.odometer).toLocaleString()} km` : "—"}</td>
                <td className="px-4 py-3 flex gap-2 justify-end">
                  <button onClick={() => openEdit(r)} className="text-gray-400 hover:text-brand-400"><Pencil size={15} /></button>
                  <button onClick={() => remove(r.id)} className="text-gray-400 hover:text-red-400"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Nenhum registro de abastecimento</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title={editing ? "Editar Abastecimento" : "Registrar Abastecimento"} onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {field("date", "Data *", "date")}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Caminhão *</label>
                <select value={form.truck_id} onChange={e => setForm(f => ({ ...f, truck_id: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100">
                  <option value="">Selecionar</option>
                  {trucks.map(t => <option key={t.id} value={t.id}>{t.plate} — {t.model}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Posto</label>
                <select value={form.supplier_id} onChange={e => setForm(f => ({ ...f, supplier_id: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100">
                  <option value="">Nenhum</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              {field("liters", "Litros *", "number")}
              {field("price_per_liter", "Preço/Litro", "number")}
              {field("total", "Total (€) *", "number")}
              {field("odometer", "Hodômetro (km)", "number")}
            </div>
            {field("notes", "Observações")}
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
