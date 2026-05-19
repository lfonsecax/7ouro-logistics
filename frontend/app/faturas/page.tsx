"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { BASE } from "@/lib/api";
import type { Client } from "@/lib/types";
import { FileText, ExternalLink, Calendar } from "lucide-react";

export default function Faturas() {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date().toISOString().slice(0, 7) + "-01";
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [dateFrom, setDateFrom] = useState(firstOfMonth);
  const [dateTo, setDateTo] = useState(today);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<Client[]>("/clients/")
      .then(setClients)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const invoiceUrl = clientId
    ? `${BASE}/routes/invoice/by-client?client_id=${clientId}&date_from=${dateFrom}&date_to=${dateTo}`
    : null;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Faturas</h1>
        <p className="text-gray-400 text-sm mt-0.5">Gerar fatura por cliente e período</p>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-5">
        {/* Cliente */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Cliente</p>
          {loading ? (
            <p className="text-sm text-gray-500">Carregando clientes...</p>
          ) : clients.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum cliente registado</p>
          ) : (
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-100 w-full focus:outline-none focus:border-brand-500"
            >
              <option value="">Selecionar cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name} {c.cif ? `(${c.cif})` : ""}</option>
              ))}
            </select>
          )}
        </div>

        {/* Período */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Calendar size={12} /> De
            </p>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-100 w-full focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Calendar size={12} /> Até
            </p>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-100 w-full focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Botão */}
        <a
          href={invoiceUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => { if (!clientId) { e.preventDefault(); alert("Seleciona um cliente primeiro"); } }}
          className={`flex items-center justify-center gap-2 w-full font-semibold py-3 rounded-lg text-sm transition-colors ${
            clientId
              ? "bg-brand-600 hover:bg-brand-700 text-white"
              : "bg-gray-800 text-gray-500 cursor-not-allowed"
          }`}
        >
          <FileText size={16} />
          Gerar Fatura
          {clientId && <ExternalLink size={14} className="opacity-60" />}
        </a>
      </div>

      {/* Preview info */}
      {clientId && (
        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 text-sm text-gray-400 space-y-1">
          <p>Fatura do período <strong>{new Date(dateFrom).toLocaleDateString("pt-BR")}</strong> a <strong>{new Date(dateTo).toLocaleDateString("pt-BR")}</strong>.</p>
          <p>Abre numa nova aba — colunas: Dia, Conceito, Preço, IVA, Total.</p>
          <p>Os dados da empresa (nome, NIF, morada) vêm do <strong>Perfil da Empresa</strong>.</p>
        </div>
      )}

      {error && <p className="text-red-400 text-sm">Erro: {error}</p>}
    </div>
  );
}
