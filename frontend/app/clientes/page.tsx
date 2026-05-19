"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Modal from "@/components/Modal";
import { api } from "@/lib/api";
import type { Client } from "@/lib/types";

const EMPTY = { name: "", cif: "", address: "", city: "", phone: "", email: "", notes: "" };

export default function Clientes() {
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<Record<string, string>>(EMPTY);
  const [error, setError] = useState("");

  const load = () => api.get<Client[]>("/clients/").then(setClients);
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setError(""); setOpen(true); };
  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({ name: c.name, cif: c.cif||"", address: c.address||"", city: c.city||"", phone: c.phone||"", email: c.email||"", notes: c.notes||"" });
    setError(""); setOpen(true);
  };

  const save = async () => {
    setError("");
    try {
      if (editing) await api.put(`/clients/${editing.id}`, form);
      else await api.post("/clients/", form);
      setOpen(false); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Erro"); }
  };

  const remove = async (id: number) => {
    if (!confirm("Remover cliente?")) return;
    await api.delete(`/clients/${id}`); load();
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
        <h1 className="text-2xl font-bold text-gray-100">Clientes</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Novo Cliente
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
              <th className="px-4 py-3 text-left">Nome</th>
              <th className="px-4 py-3 text-left">CIF</th>
              <th className="px-4 py-3 text-left">Cidade</th>
              <th className="px-4 py-3 text-left">Telefone</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-gray-400 font-mono text-xs">{c.cif || "—"}</td>
                <td className="px-4 py-3 text-gray-400">{c.city || "—"}</td>
                <td className="px-4 py-3 text-gray-400">{c.phone || "—"}</td>
                <td className="px-4 py-3 text-gray-400">{c.email || "—"}</td>
                <td className="px-4 py-3 flex gap-2 justify-end">
                  <button onClick={() => openEdit(c)} className="text-gray-400 hover:text-brand-400"><Pencil size={15} /></button>
                  <button onClick={() => remove(c.id)} className="text-gray-400 hover:text-red-400"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Nenhum cliente cadastrado</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title={editing ? "Editar Cliente" : "Novo Cliente"} onClose={() => setOpen(false)}>
          <div className="space-y-3">
            {field("name", "Nome *")}
            {field("cif", "CIF / NIF")}
            <div className="grid grid-cols-2 gap-3">
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
