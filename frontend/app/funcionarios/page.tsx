"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Modal from "@/components/Modal";
import { api } from "@/lib/api";
import type { Employee } from "@/lib/types";

const TYPE_LABEL = { driver: "Motorista", helper: "Ajudante" };
const EMPTY = { name: "", type: "driver", phone: "", cnh: "", cnh_expiry: "", salary: "", daily_rate: "", active: "true", notes: "" };

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "EUR" });

export default function Funcionarios() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<Record<string, string>>(EMPTY);
  const [error, setError] = useState("");

  const load = () => api.get<Employee[]>("/employees/").then(setEmployees);
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setError(""); setOpen(true); };
  const openEdit = (e: Employee) => {
    setEditing(e);
    setForm({ name: e.name, type: e.type, phone: e.phone||"", cnh: e.cnh||"", cnh_expiry: e.cnh_expiry||"", salary: String(e.salary||0), daily_rate: String(e.daily_rate||0), active: String(e.active), notes: e.notes||"" });
    setError(""); setOpen(true);
  };

  const save = async () => {
    setError("");
    const body = { ...form, salary: form.salary ? +form.salary : 0, daily_rate: form.daily_rate ? +form.daily_rate : 0, active: form.active === "true", cnh_expiry: form.cnh_expiry || undefined };
    try {
      if (editing) await api.put(`/employees/${editing.id}`, body);
      else await api.post("/employees/", body);
      setOpen(false); load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Erro"); }
  };

  const remove = async (id: number) => {
    if (!confirm("Remover funcionário?")) return;
    await api.delete(`/employees/${id}`); load();
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
        <h1 className="text-2xl font-bold text-gray-100">Funcionários</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus size={16} /> Novo Funcionário
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
              <th className="px-4 py-3 text-left">Nome</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Telefone</th>
              <th className="px-4 py-3 text-left">Salário</th>
              <th className="px-4 py-3 text-left">Diária</th>
              <th className="px-4 py-3 text-left">CNH Vence</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {employees.map(e => (
              <tr key={e.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="px-4 py-3 font-medium">{e.name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${e.type === "driver" ? "bg-blue-900 text-blue-300" : "bg-purple-900 text-purple-300"}`}>
                    {TYPE_LABEL[e.type]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">{e.phone || "—"}</td>
                <td className="px-4 py-3">{e.salary ? fmt(Number(e.salary)) : "—"}</td>
                <td className="px-4 py-3">{e.type === "helper" && e.daily_rate ? fmt(Number(e.daily_rate)) + "/dia" : "—"}</td>
                <td className="px-4 py-3 text-gray-400">{e.cnh_expiry ? new Date(e.cnh_expiry).toLocaleDateString("pt-BR") : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${e.active ? "bg-green-900 text-green-300" : "bg-gray-700 text-gray-400"}`}>
                    {e.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2 justify-end">
                  <button onClick={() => openEdit(e)} className="text-gray-400 hover:text-brand-400"><Pencil size={15} /></button>
                  <button onClick={() => remove(e.id)} className="text-gray-400 hover:text-red-400"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Nenhum funcionário cadastrado</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title={editing ? "Editar Funcionário" : "Novo Funcionário"} onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {field("name", "Nome *")}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Tipo *</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100">
                  <option value="driver">Motorista</option>
                  <option value="helper">Ajudante</option>
                </select>
              </div>
              {field("phone", "Telefone")}
              {field("salary", "Salário (mês)", "number")}
              {form.type === "helper" && field("daily_rate", "Diária (€)", "number")}
              {field("cnh", "CNH")}
              {field("cnh_expiry", "Vencimento CNH", "date")}
              <div>
                <label className="block text-xs text-gray-400 mb-1">Status</label>
                <select value={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100">
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
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
