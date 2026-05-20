"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Modal from "@/components/Modal";
import { api } from "@/lib/api";
import type { Truck } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  active: "Ativo", inactive: "Inativo", in_maintenance: "Em Manutenção"
};
const STATUS_COLOR: Record<string, string> = {
  active: "bg-green-900 text-green-300", inactive: "bg-gray-700 text-gray-400", in_maintenance: "bg-yellow-900 text-yellow-300"
};

const EMPTY = { plate: "", model: "", brand: "", year: "", capacity_kg: "", odometer: "", status: "active", notes: "" };

export default function Caminhoes() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Truck | null>(null);
  const [form, setForm] = useState<Record<string, string>>(EMPTY);
  const [error, setError] = useState("");

  const load = () => api.get<Truck[]>("/trucks/").then(setTrucks);
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setError(""); setOpen(true); };
  const openEdit = (t: Truck) => {
    setEditing(t);
    setForm({ plate: t.plate, model: t.model, brand: t.brand||"", year: String(t.year||""), capacity_kg: String(t.capacity_kg||""), odometer: String(t.odometer||""), status: t.status, notes: t.notes||"" });
    setError(""); setOpen(true);
  };

  const save = async () => {
    setError("");
    const body = { ...form, year: form.year ? +form.year : undefined, capacity_kg: form.capacity_kg ? +form.capacity_kg : undefined, odometer: form.odometer ? +form.odometer : undefined };
    try {
      if (editing) await api.put(`/trucks/${editing.id}`, body);
      else await api.post("/trucks", body);
      setOpen(false); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Erro"); }
  };

  const remove = async (id: number) => {
    if (!confirm("Remover caminhão?")) return;
    await api.delete(`/trucks/${id}`); load();
  };

  const field = (k: string, label: string, type = "text") => (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input type={type} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-500" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-100">Caminhões</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Novo Caminhão
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
              <th className="px-4 py-3 text-left">Placa</th>
              <th className="px-4 py-3 text-left">Modelo</th>
              <th className="px-4 py-3 text-left">Ano</th>
              <th className="px-4 py-3 text-left">Hodômetro</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {trucks.map(t => (
              <tr key={t.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="px-4 py-3 font-mono font-bold text-brand-400">{t.plate}</td>
                <td className="px-4 py-3">{t.brand ? `${t.brand} ${t.model}` : t.model}</td>
                <td className="px-4 py-3 text-gray-400">{t.year || "—"}</td>
                <td className="px-4 py-3 text-gray-400">{t.odometer ? `${Number(t.odometer).toLocaleString()} km` : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[t.status]}`}>{STATUS_LABEL[t.status]}</span>
                </td>
                <td className="px-4 py-3 flex gap-2 justify-end">
                  <button onClick={() => openEdit(t)} className="text-gray-400 hover:text-brand-400"><Pencil size={15} /></button>
                  <button onClick={() => remove(t.id)} className="text-gray-400 hover:text-red-400"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
            {trucks.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Nenhum caminhão cadastrado</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title={editing ? "Editar Caminhão" : "Novo Caminhão"} onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {field("plate", "Placa *")}
              {field("model", "Modelo *")}
              {field("brand", "Marca")}
              {field("year", "Ano", "number")}
              {field("capacity_kg", "Capacidade (kg)", "number")}
              {field("odometer", "Hodômetro (km)", "number")}
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100">
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="in_maintenance">Em Manutenção</option>
              </select>
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
