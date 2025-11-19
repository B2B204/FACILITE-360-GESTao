import React, { useEffect, useState } from "react";
import { User } from "@/api/entities";
import { SupportTicket } from "@/api/entities";
import { KnowledgeBaseArticle } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { LifeBuoy, Upload } from "lucide-react";

export default function SupportPage() {
  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [kb, setKb] = useState([]);
  const [form, setForm] = useState({ title:"", description:"", priority:"media", files:[] });

  useEffect(()=>{ (async()=>{
    const me = await User.me();
    setUser(me);
    const [t, k] = await Promise.all([
      SupportTicket.filter({ cnpj: me.cnpj }),
      KnowledgeBaseArticle.filter({ cnpj: me.cnpj })
    ].map(p=>p.catch(()=>[])));
    setTickets(t||[]);
    setKb(k||[]);
  })(); },[]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const attachments = [];
    for (const f of form.files) {
      const { file_url } = await UploadFile({ file: f });
      attachments.push(file_url);
    }
    await SupportTicket.create({
      title: form.title, description: form.description, priority: form.priority, status:"aberto",
      attachments, requester_email: user.email, cnpj: user.cnpj
    });
    setForm({ title:"", description:"", priority:"media", files:[] });
    const t = await SupportTicket.filter({ cnpj: user.cnpj });
    setTickets(t);
    alert("Chamado aberto com sucesso!");
  };

  return (
    <div className="p-8 space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><LifeBuoy className="w-5 h-5" /> Suporte</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input placeholder="Título do chamado" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} />
            <Textarea rows={4} placeholder="Descreva o problema..." value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
            <div className="flex gap-2 items-center">
              <select className="border rounded px-2 py-1" value={form.priority} onChange={e=>setForm({...form, priority:e.target.value})}>
                <option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option><option value="critica">Crítica</option>
              </select>
              <label className="flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                <input type="file" multiple className="hidden" onChange={e=>setForm({...form, files: Array.from(e.target.files||[])})} />
                Anexar
              </label>
              <Button type="submit">Abrir chamado</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Meus Chamados</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Título</TableHead><TableHead>Prioridade</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {tickets.map(t=>(
                <TableRow key={t.id}>
                  <TableCell>{t.title}</TableCell>
                  <TableCell>{t.priority}</TableCell>
                  <TableCell>{t.status}</TableCell>
                </TableRow>
              ))}
              {tickets.length===0 && <TableRow><TableCell colSpan={3} className="text-center text-gray-500 py-6">Sem chamados.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}