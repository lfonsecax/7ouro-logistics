"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Modal from "@/components/Modal";
import { api } from "@/lib/api";
import type { MaintenanceRecord, Truck, Supplier } from "@/lib/types";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "EUR" });
const TYPE_LABEL = { preventive: "Preventiva", corrective: "Corretiva" };
const TYPE_COLOR = { preventive: "bg-blue-900 text-blue-300", corrective: "bg-red-900 text-red-300" };
const EMPTY = { date: "", truck_id: "", supplier_id: "", type: "preventive", description: "", cost: "", odometer: "", notes: "" };

export default function Manutencao() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MaintenanceRecord | null>(null);
  const [form, setForm] = useState<Record<string, string>>(EMPTY);
  const [error, setError] = useState("");

  const load = () => api.get<MaintenanceRecord[]>("/maintenance/").then(setRecords);
  useEffect(() => {
    load();
    api.get<Truck[]>("/trucks/").then(setTrucks);
    api.get<Supplier[]>("/suppliers/?type=workshop").then(setSuppliers);
  }, []);

  const openCreate = () => {
    const today = new Date().toISOString().slice(0, 10);
    setEditing(null); setForm({ ...EMPTY, date: today }); setError(""); setOpen(true);
  };
  const openEdit = (r: MaintenanceRecord) => {
    setEditing(r);
    setForm({
      date: r.date ?? "",
      truck_id: String(r.truck_id),
      supplier_id: r.supplier_id != null ? String(r.supplier_id) : "",
      type: r.type,
      description: r.description ?? "",
      cost: r.cost != null ? String(r.cost) : "",
      odometer: r.odometer != null ? String(r.odometer) : "",
      notes: r.notes ?? "",
    });
    setError(""); setOpen(true);
  };

  const save = async () => {
    setError("");
    if (!form.date) { setError("Data é obrigatória"); return; }
    if (!form.truck_id) { setError("Selecione um caminhão"); return; }
    if (!form.description.trim()) { setError("Descrição é obrigatória"); return; }
    const body = {
      date: form.date,
      truck_id: +form.truck_id,
      supplier_id: form.supplier_id ? +form.supplier_id : undefined,
      type: form.type,
      description: form.description,
      cost: parseFloat(form.cost) || 0,
      odometer: form.odometer ? parseFloat(form.odometer) || undefined : undefined,
      notes: form.notes || undefined,
    };
    try {
      if (editing) await api.put(`/maintenance/${editing.id}`, body);
      else await api.post("/maintenance/", body);
      setOpen(false); load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro";
      setError(msg);
      console.error("Maintenance save error:", msg, "Body sent:", JSON.stringify(body));
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Remover registro?")) return;
    await api.delete(`/maintenance/${id}`); load();
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
        <h1 className="text-2xl font-bold text-gray-100">Manutenção</h1>
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
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Descrição</th>
              <th className="px-4 py-3 text-left">Oficina</th>
              <th className="px-4 py-3 text-right">Custo</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="px-4 py-3">{new Date(r.date).toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-3 font-mono text-brand-400">{r.truck?.plate || r.truck_id}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLOR[r.type]}`}>{TYPE_LABEL[r.type]}</span>
                </td>
                <td className="px-4 py-3">{r.description}</td>
                <td className="px-4 py-3 text-gray-400">{r.supplier?.name || "—"}</td>
                <td className="px-4 py-3 text-right font-semibold">{fmt(Number(r.cost))}</td>
                <td className="px-4 py-3 flex gap-2 justify-end">
                  <button onClick={() => openEdit(r)} className="text-gray-400 hover:text-brand-400"><Pencil size={15} /></button>
                  <button onClick={() => remove(r.id)} className="text-gray-400 hover:text-red-400"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Nenhum registro de manutenção</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title={editing ? "Editar Manutenção" : "Registrar Manutenção"} onClose={() => setOpen(false)}>
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
                <label className="block text-xs text-gray-400 mb-1">Tipo *</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100">
                  <option value="preventive">Preventiva</option>
                  <option value="corrective">Corretiva</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Oficina</label>
                <select value={form.supplier_id} onChange={e => setForm(f => ({ ...f, supplier_id: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100">
                  <option value="">Nenhuma</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              {field("cost", "Custo (€)", "number")}
              {field("odometer", "Hodômetro (km)", "number")}
            </div>
            {field("description", "Descrição *")}
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
