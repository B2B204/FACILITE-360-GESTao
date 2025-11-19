
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ReactQuill from "react-quill";
import { UploadFile } from "@/api/integrations";
import { Table2, Save, Eye, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Employee } from "@/api/entities";

// src/components/oficios/OficioForm.jsx
import React, { useState } from "react";

export default function OficioForm() {
  const [assunto, setAssunto] = useState("");
  const [destinatario, setDestinatario] = useState("");
  const [corpo, setCorpo] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aqui você pode integrar com API ou só fazer um console.log por enquanto
    console.log({
      assunto,
      destinatario,
      corpo,
    });
    alert("Ofício salvo (simulação).");
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Cadastro de Ofício</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Assunto</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2 text-sm"
            value={assunto}
            onChange={(e) => setAssunto(e.target.value)}
            placeholder="Informe o assunto do ofício"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Destinatário
          </label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2 text-sm"
            value={destinatario}
            onChange={(e) => setDestinatario(e.target.value)}
            placeholder="Informe o destinatário"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Texto do ofício
          </label>
          {/* Aqui substituímos o ReactQuill por um textarea simples */}
          <textarea
            className="w-full border rounded px-3 py-2 text-sm min-h-[180px]"
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
            placeholder="Digite o texto do ofício..."
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="px-4 py-2 text-sm border rounded"
            onClick={() => {
              setAssunto("");
              setDestinatario("");
              setCorpo("");
            }}
          >
            Limpar
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm rounded bg-blue-600 text-white"
          >
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}
