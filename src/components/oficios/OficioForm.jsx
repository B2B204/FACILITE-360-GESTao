
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

export default function OficioForm({ oficio, onSave, onCancel, currentUser, suggestedNumber }) {
  const [form, setForm] = useState({
    numero_oficio: "",
    destinatario: "",
    assunto: "",
    data_emissao: "",
    assinante_nome: currentUser?.full_name || "",
    cargo_assinante: currentUser?.cargo || "",
    assinante_matricula: currentUser?.matricula || "",
    signer_employee_id: "",
    corpo_oficio: "<p></p>",
    tipo_oficio: oficio?.tipo_oficio || "",
    contract_id: oficio?.contract_id || ""
  });
  const [showPreview, setShowPreview] = useState(false);
  const [employees, setEmployees] = useState([]);
  const quillRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Carregar funcionários para seleção de assinante
    const loadEmployees = async () => {
      try {
        if (!currentUser?.cnpj) return;
        const list = await Employee.filter({ cnpj: currentUser.cnpj }, "-created_date", 200);
        setEmployees(list);
      } catch (e) {
        console.log("Não foi possível carregar funcionários para assinatura:", e?.message || e);
      }
    };
    loadEmployees();
  }, [currentUser?.cnpj]);

  useEffect(() => {
    if (oficio) {
      setForm({
        numero_oficio: oficio.numero_oficio || "",
        destinatario: oficio.destinatario || "",
        assunto: oficio.assunto || "",
        data_emissao: oficio.data_emissao ? String(oficio.data_emissao).substring(0, 10) : "",
        assinante_nome: oficio.assinante_nome || currentUser?.full_name || "",
        cargo_assinante: oficio.cargo_assinante || currentUser?.cargo || "",
        assinante_matricula: oficio.assinante_matricula || currentUser?.matricula || "",
        signer_employee_id: oficio.signer_employee_id || "",
        corpo_oficio: oficio.corpo_oficio || "<p></p>",
        tipo_oficio: oficio.tipo_oficio || "",
        contract_id: oficio.contract_id || ""
      });
    } else if (suggestedNumber) {
      setForm(f => ({ ...f, numero_oficio: suggestedNumber }));
    }
  }, [oficio, currentUser, suggestedNumber]);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ font: [] }, { size: ['small', false, 'large', 'huge'] }],
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ align: "" }, { align: "center" }, { align: "right" }, { align: "justify" }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ color: [] }, { background: [] }],
        ["blockquote", "code-block"],
        ["link", "image"],
        ["clean"]
      ],
      handlers: {
        image: () => fileInputRef.current?.click()
      }
    },
    clipboard: { matchVisual: false }
  }), []);

  const formats = [
    "header", "bold", "italic", "underline", "strike",
    "align", "list", "bullet", "size", "color", "background",
    "blockquote", "code-block", "image", "link", "font"
  ];

  const insertTable = () => {
    const quill = quillRef.current?.getEditor?.();
    if (!quill) return;
    const tableHtml = `
      <table style="width:100%; border-collapse: collapse;" border="1">
        <tr><th style="padding:6px;">Cabeçalho 1</th><th style="padding:6px;">Cabeçalho 2</th></tr>
        <tr><td style="padding:6px;">Linha 1, Col 1</td><td style="padding:6px;">Linha 1, Col 2</td></tr>
        <tr><td style="padding:6px;">Linha 2, Col 1</td><td style="padding:6px;">Linha 2, Col 2</td></tr>
      </table><p></p>
    `;
    const range = quill.getSelection(true);
    quill.clipboard.dangerouslyPasteHTML(range.index, tableHtml);
  };

  const insertPageBreak = () => {
    const quill = quillRef.current?.getEditor?.();
    if (!quill) return;
    const range = quill.getSelection(true);
    const pb = `<div class="page-break" style="border-top:1px dashed #ccc; margin:12px 0;"></div><p></p>`;
    quill.clipboard.dangerouslyPasteHTML(range.index, pb);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await UploadFile({ file });
      const quill = quillRef.current?.getEditor?.();
      if (!quill) return;
      const range = quill.getSelection(true);
      quill.insertEmbed(range.index, "image", file_url, "user");
      quill.setSelection(range.index + 1, 0);
    } catch (err) {
      alert("Falha ao enviar imagem. Tente novamente.");
      console.error(err);
    } finally {
      e.target.value = "";
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.numero_oficio || !form.destinatario || !form.assunto || !form.data_emissao || !form.assinante_nome || !form.cargo_assinante) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }
    onSave({
      ...oficio,
      numero_oficio: form.numero_oficio,
      destinatario: form.destinatario,
      assunto: form.assunto,
      data_emissao: form.data_emissao,
      assinante_nome: form.assinante_nome,
      cargo_assinante: form.cargo_assinante,
      assinante_matricula: form.assinante_matricula,
      signer_employee_id: form.signer_employee_id,
      corpo_oficio: form.corpo_oficio,
      tipo_oficio: form.tipo_oficio,
      contract_id: form.contract_id
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <Label>Número do Ofício *</Label>
            <Input value={form.numero_oficio} onChange={(e) => setForm(f => ({ ...f, numero_oficio: e.target.value }))} placeholder={suggestedNumber || "0001/2025"} />
          </div>
          <div className="md:col-span-1">
            <Label>Data de Emissão *</Label>
            <Input type="date" value={form.data_emissao} onChange={(e) => setForm(f => ({ ...f, data_emissao: e.target.value }))} />
          </div>
          <div className="md:col-span-1">
            <Label>Tipo de Ofício (Opcional)</Label>
            <Input value={form.tipo_oficio} onChange={(e) => setForm(f => ({ ...f, tipo_oficio: e.target.value }))} placeholder="ex.: encaminhamento_medicao" />
          </div>

          <div className="md:col-span-2">
            <Label>Destinatário *</Label>
            <Input value={form.destinatario} onChange={(e) => setForm(f => ({ ...f, destinatario: e.target.value }))} />
          </div>
          <div className="md:col-span-1">
            <Label>Assunto *</Label>
            <Input value={form.assunto} onChange={(e) => setForm(f => ({ ...f, assunto: e.target.value }))} />
          </div>

          {/* Seleção do assinante */}
          <div className="md:col-span-3">
            <Label>Assinante (selecionar Funcionário)</Label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <Select
                  value={form.signer_employee_id || ""}
                  onValueChange={(employeeId) => {
                    const emp = employees.find(e => e.id === employeeId);
                    if (emp) {
                      setForm(f => ({
                        ...f,
                        signer_employee_id: employeeId,
                        assinante_nome: emp.name || f.assinante_nome,
                        cargo_assinante: emp.role || f.cargo_assinante,
                        assinante_matricula: emp.matricula || f.assinante_matricula
                      }));
                    } else {
                      setForm(f => ({ ...f, signer_employee_id: "", }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o funcionário assinante" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} • {emp.role || "—"} {emp.matricula ? `• Mat: ${emp.matricula}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Nome do Assinante *</Label>
                <Input value={form.assinante_nome} onChange={(e) => setForm(f => ({ ...f, assinante_nome: e.target.value }))} />
              </div>
              <div>
                <Label>Cargo do Assinante *</Label>
                <Input value={form.cargo_assinante} onChange={(e) => setForm(f => ({ ...f, cargo_assinante: e.target.value }))} />
              </div>
              <div>
                <Label>Matrícula</Label>
                <Input value={form.assinante_matricula} onChange={(e) => setForm(f => ({ ...f, assinante_matricula: e.target.value }))} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Editor avançado com fontes, tamanhos, alinhamento, listas, links, imagens, tabelas e quebra de página.
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={insertTable}>
            <Table2 className="w-4 h-4 mr-2" /> Inserir Tabela
          </Button>
          <Button type="button" variant="outline" onClick={insertPageBreak}>
            <Table2 className="w-4 h-4 mr-2" /> Quebra de Página
          </Button>
          <Button type="button" variant={showPreview ? "secondary" : "outline"} onClick={() => setShowPreview(p => !p)}>
            <Eye className="w-4 h-4 mr-2" /> {showPreview ? "Ocultar Prévia" : "Pré-visualizar"}
          </Button>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />

      {/* Editor + Prévia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-[520px] border rounded-lg overflow-hidden bg-white">
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={form.corpo_oficio}
            onChange={(html) => setForm(f => ({ ...f, corpo_oficio: html }))}
            modules={modules}
            formats={formats}
            style={{ height: 520 }}
          />
        </div>

        {showPreview && (
          <div className="border rounded-lg bg-white overflow-auto p-4 max-h-[520px]">
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: form.corpo_oficio }}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" /> Cancelar
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" /> Salvar Ofício
        </Button>
      </div>
    </form>
  );
}
