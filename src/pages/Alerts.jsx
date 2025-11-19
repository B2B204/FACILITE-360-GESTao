
import React, { useEffect, useState } from "react";
import { Alert as AlertEntity } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

export default function AlertsPage() {
  const [user, setUser] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("pending");

  useEffect(()=>{ load(); },[]);
  const load = async ()=>{
    const me = await User.me();
    setUser(me);
    const data = await AlertEntity.filter({ cnpj: me.cnpj });
    setAlerts(data);
  };

  const markRead = async (a) => {
    await AlertEntity.update(a.id, { status: "read" });
    load();
  };

  const filtered = alerts.filter(a=>{
    const t = typeFilter==="all" || a.type===typeFilter;
    const s = statusFilter==="all" || a.status===statusFilter;
    return t && s;
  });

  const typeLabel = {
    contract_expiry:"Contrato vencendo",
    employee_probation:"Período de experiência",
    insurance_expiry:"Seguro a vencer",
    laudo_expiry:"Laudo a vencer",
    custom:"Personalizado"
  };

  return (
    <div className="p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Filter className="w-5 h-5" /> Central de Alertas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <select className="border rounded px-2 py-1" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
              <option value="all">Todos os tipos</option>
              {Object.keys(typeLabel).map(k=><option key={k} value={k}>{typeLabel[k]}</option>)}
            </select>
            <select className="border rounded px-2 py-1" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
              <option value="pending">Pendentes</option>
              <option value="read">Lidos</option>
              <option value="all">Todos</option>
            </select>
            <Button variant="outline" onClick={load}>Atualizar</Button>
          </div>
          <div className="overflow-x-auto"> {/* added wrapper for horizontal scroll */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Tipo</TableHead>
                  <TableHead className="min-w-[300px]">Mensagem</TableHead>
                  <TableHead className="min-w-[140px]">Vencimento</TableHead>
                  <TableHead className="min-w-[120px]">Status</TableHead>
                  <TableHead className="min-w-[120px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(a=>(
                  <TableRow key={a.id}>
                    <TableCell>{typeLabel[a.type]||a.type}</TableCell>
                    <TableCell>{a.message}</TableCell>
                    <TableCell>{a.due_date ? new Date(a.due_date).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>
                      <Badge className={a.status==="pending"?"bg-amber-100 text-amber-800":"bg-gray-100 text-gray-700"}>
                        {a.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {a.status==="pending" && (
                        <Button size="sm" onClick={()=>markRead(a)}>Marcar como lido</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length===0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-gray-500 py-6">Sem alertas neste filtro.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
