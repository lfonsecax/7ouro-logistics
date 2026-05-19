"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Building2, Save } from "lucide-react";

interface CompanyData {
  name: string;
  address: string;
  city: string;
  zip_code: string;
  vat_id: string;
  phone: string;
  email: string;
  logo_url: string;
}

const EMPTY: CompanyData = {
  name: "7Ouro Logistics",
  address: "",
  city: "",
  zip_code: "",
  vat_id: "",
  phone: "",
  email: "",
  logo_url: "",
};

export default function Empresa() {
  const [form, setForm] = useState<CompanyData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api.get<CompanyData>("/company/profile")
      .then((data) => setForm(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const field = (k: keyof CompanyData, label: string, placeholder?: string) => (
    <div>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input
        value={form[k]}
        onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
        placeholder={placeholder}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-brand-500"
      />
    </div>
  );

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await api.put("/company/profile", form);
      setMsg({ ok: true, text: "Perfil atualizado!" });
    } catch (e: unknown) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Erro ao salvar" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-gray-500 text-sm text-center py-8">Carregando...</p>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Building2 size={24} className="text-brand-400" />
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Perfil da Empresa</h1>
          <p className="text-gray-400 text-sm">Dados que aparecem nas faturas</p>
        </div>
      </div>

      {msg && (
        <div className={`text-sm px-4 py-2 rounded-lg flex items-center justify-between ${
          msg.ok ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"
        }`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="opacity-60 hover:opacity-100">&times;</button>
        </div>
      )}

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field("name", "Nome da Empresa", "7Ouro Logistics")}
          {field("vat_id", "NIF / CIF", "ES12345678")}
          {field("address", "Morada", "Rua ...")}
          {field("city", "Cidade", "Valencia")}
          {field("zip_code", "Código Postal", "46940")}
          {field("phone", "Telefone", "+34 ...")}
          {field("email", "Email", "..." )}
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
        >
          <Save size={16} /> {saving ? "Salvando..." : "Salvar Perfil"}
        </button>
      </div>

      <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 text-sm text-gray-400">
        <p>Estes dados aparecem no cabeçalho das faturas geradas. Preenche o NIF para aparecer na fatura.</p>
      </div>
    </div>
  );
}
