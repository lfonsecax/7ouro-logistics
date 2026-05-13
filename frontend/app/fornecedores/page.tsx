"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Modal from "@/components/Modal";
import { api } from "@/lib/api";
import type { Supplier } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = { workshop: "Oficina", gas_station: "Posto", other: "Outro" };
const TYPE_COLOR: Record<string, string> = { workshop: "bg-blue-900 text-blue-300", gas_station: "bg-yellow-900 text-yellow-300", other: "bg-gray-700 text-gray-300" };
const EMPTY = { name: "", type: "other", address: "", city: "", phone: "", email: "", notes: "" };

export default function Fornecedores() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<Record<string, string>>(EMPTY);
  const [error, setError] = useState("");

  const load = () => api.get<Supplier[]>("/suppliers/").then(setSuppliers);
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setError(""); setOpen(true); };
  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({ name: s.name, type: s.type, address: s.address||"", city: s.city||"", phone: s.phone||"", email: s.email||"", notes: s.notes||"" });
    setError(""); setOpen(true);
  };

  const save = async () => {
    setError("");
    try {
      if (editing) await api.put(`/suppliers/${editing.id}`, form);
      else await api.post("/suppliers/", form);
      setOpen(false); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Erro"); }
  };

  const remove = async (id: number) => {
    if (!confirm("Remover fornecedor?")) return;
    await api.delete(`/suppliers/${id}`); load();
  };

  const field = (k: string, label: string) => (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-500" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-100">Fornecedores</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Novo Fornecedor
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
              <th className="px-4 py-3 text-left">Nome</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Cidade</th>
              <th className="px-4 py-3 text-left">Telefone</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {suppliers.map(s => (
              <tr key={s.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLOR[s.type]}`}>{TYPE_LABEL[s.type]}</span>
                </td>
                <td className="px-4 py-3 text-gray-400">{s.city || "—"}</td>
                <td className="px-4 py-3 text-gray-400">{s.phone || "—"}</td>
                <td className="px-4 py-3 flex gap-2 justify-end">
                  <button onClick={() => openEdit(s)} className="text-gray-400 hover:text-brand-400"><Pencil size={15} /></button>
                  <button onClick={() => remove(s.id)} className="text-gray-400 hover:text-red-400"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
            {suppliers.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Nenhum fornecedor cadastrado</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title={editing ? "Editar Fornecedor" : "Novo Fornecedor"} onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {field("name", "Nome *")}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Tipo</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100">
                  <option value="gas_station">Posto de Combustível</option>
                  <option value="workshop">Oficina</option>
                  <option value="other">Outro</option>
                </select>
              </div>
              {field("address", "Endereço")}
              {field("city", "Cidade")}
              {field("phone", "Telefone")}
              {field("email", "Email")}
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
