
import React, { useEffect, useState, useCallback } from "react";
import { ServiceOrderChecklist } from "@/api/entities";
import { User } from "@/api/entities";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function ChecklistManager({ serviceOrderId, onChanged }) {
  const [items, setItems] = useState([]);
  const [user, setUser] = useState(null);
  const [text, setText] = useState("");

  const load = useCallback(async () => {
    if (!serviceOrderId) return;
    const u = await User.me(); 
    setUser(u);
    const list = await ServiceOrderChecklist.filter({ cnpj: u.cnpj, service_order_id: serviceOrderId });
    setItems(list);
  }, [serviceOrderId]);

  useEffect(() => { load(); }, [load]);

  const addItem = async () => {
    if (!text.trim()) return;
    await ServiceOrderChecklist.create({ service_order_id: serviceOrderId, item: text.trim(), cnpj: user.cnpj });
    setText("");
    await load(); 
    onChanged?.();
  };
  const toggle = async (it) => {
    await ServiceOrderChecklist.update(it.id, { is_done: !it.is_done, done_at: !it.is_done ? new Date().toISOString() : null, done_by: user?.email });
    await load(); 
    onChanged?.();
  };
  const remove = async (it) => {
    await ServiceOrderChecklist.delete(it.id);
    await load(); 
    onChanged?.();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input placeholder="Nova etapa do checklist" value={text} onChange={(e)=>setText(e.target.value)} />
        <Button onClick={addItem}>Adicionar</Button>
      </div>
      <div className="space-y-2">
        {items.map(it=>(
          <div key={it.id} className="flex items-center justify-between border rounded p-2">
            <div className="flex items-center gap-2">
              <Checkbox checked={!!it.is_done} onCheckedChange={()=>toggle(it)} />
              <span className={it.is_done ? "line-through text-gray-500" : ""}>{it.item}</span>
            </div>
            <button className="text-red-600 text-sm" onClick={()=>remove(it)}>Remover</button>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-500">Nenhum item no checklist.</p>}
      </div>
    </div>
  );
}
