import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles } from "lucide-react";
import { InvokeLLM } from "@/api/integrations";
import { AISuggestion } from "@/api/entities";
import { User } from "@/api/entities";

export default function AISuggester({ label="Sugerir texto (IA)", contextType, contextId, defaultPrompt }) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState(defaultPrompt || "");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const buildComplianceIntro = () => {
    if (contextType === "oficio") {
      return [
        "Você é um redator jurídico especializado em contratações públicas.",
        "Base normativa obrigatória: Lei 14.133/2021 (Nova Lei de Licitações e Contratos Administrativos).",
        "Instruções:",
        "- redija o texto em linguagem formal e objetiva;",
        "- inclua fundamentação legal (Lei 14.133/21) e indique artigos pertinentes quando aplicável;",
        "- traga estrutura típica: identificação, objeto, contexto, fundamentação, providências/prazos, assinatura;",
        "- não invente dados de contrato; use apenas informações fornecidas no contexto.",
      ].join("\n");
    }
    if (contextType === "repactuacao") {
      return [
        "Você é um redator jurídico especializado em repactuação/reequilíbrio em contratos administrativos.",
        "Base normativa: Lei 14.133/2021 e normativos correlatos (sem inventar referências).",
        "Instruções:",
        "- redija um pedido claro de repactuação/reequilíbrio com motivação, índices/datas, impactos e prazos;",
        "- inclua fundamentação legal pertinente à Lei 14.133/21, citando dispositivos quando aplicável;",
        "- não invente valores ou datas não fornecidas; destaque campos que precisam de conferência.",
      ].join("\n");
    }
    return "";
  };

  const run = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      const complianceIntro = buildComplianceIntro();
      const finalPrompt = complianceIntro ? `${complianceIntro}\n\n${prompt}` : prompt;

      const suggestion = await InvokeLLM({ prompt: finalPrompt });
      const text = typeof suggestion === "string" ? suggestion : JSON.stringify(suggestion, null, 2);
      setResult(text);

      await AISuggestion.create({
        context_type: contextType,
        context_id: contextId || "",
        prompt: finalPrompt,
        suggestion: text,
        generated_by: user.email,
        cnpj: user.cnpj,
        generated_at: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(result || "");
    setOpen(false);
    alert("Texto copiado para a área de transferência.");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><Sparkles className="w-4 h-4 mr-2" />{label}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader><DialogTitle>Assistente de Texto (IA)</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Textarea value={prompt} onChange={(e)=>setPrompt(e.target.value)} rows={5} placeholder="Descreva o contexto, base legal, índices, datas..." />
          <Button onClick={run} disabled={loading}>{loading? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gerando...</> : "Gerar Sugestão"}</Button>
          {result && (
            <div className="bg-gray-50 border rounded p-3">
              <pre className="whitespace-pre-wrap text-sm">{result}</pre>
              <div className="text-right mt-2">
                <Button onClick={copy}>Usar este texto</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}