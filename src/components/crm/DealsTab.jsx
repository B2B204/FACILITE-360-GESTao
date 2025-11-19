// src/components/crm/DealsTab.jsx
import React from "react";

const MOCK_DEALS = [
  { id: 1, title: "Contrato Limpeza Clínica X", value: 12000, stage: "Prospecção" },
  { id: 2, title: "Contrato Condomínio Y", value: 35000, stage: "Proposta Enviada" },
  { id: 3, title: "Renovação Órgão Público Z", value: 80000, stage: "Em Negociação" },
];

export default function DealsTab({ user }) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Negócios (CRM)</h2>
        {user && (
          <span className="text-sm text-gray-500">
            Usuário: {user.name || user.email}
          </span>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {MOCK_DEALS.map((deal) => (
          <div
            key={deal.id}
            className="border rounded-md p-3 bg-white shadow-sm"
          >
            <div className="text-sm font-medium mb-1">{deal.title}</div>
            <div className="text-xs text-gray-500 mb-1">
              Etapa: <span className="font-semibold">{deal.stage}</span>
            </div>
            <div className="text-sm font-semibold text-green-700">
              Valor: R$ {deal.value.toLocaleString("pt-BR")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Deal } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import { Plus, Search, DollarSign } from 'lucide-react';
import { canViewAllDeals } from '@/components/permissions';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import DealForm from './DealForm';

const MOCK_DEALS = [
  { id: 1, title: "Contrato Limpeza Clínica X", value: 12000, stage: "Prospecção" },
  { id: 2, title: "Contrato Condomínio Y", value: 35000, stage: "Proposta Enviada" },
  { id: 3, title: "Renovação Órgão Público Z", value: 80000, stage: "Em Negociação" },
];

export default function DealsTab({ user }) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Negócios (CRM)</h2>
        {user && (
          <span className="text-sm text-gray-500">
            Usuário: {user.name || user.email}
          </span>
        )}
      </div>

      {/* Aqui antes era drag & drop com @hello-pangea/dnd. Agora é uma lista simples. */}
      <div className="grid gap-3 md:grid-cols-3">
        {MOCK_DEALS.map((deal) => (
          <div
            key={deal.id}
            className="border rounded-md p-3 bg-white shadow-sm"
          >
            <div className="text-sm font-medium mb-1">{deal.title}</div>
            <div className="text-xs text-gray-500 mb-1">
              Etapa: <span className="font-semibold">{deal.stage}</span>
            </div>
            <div className="text-sm font-semibold text-green-700">
              Valor: R$ {deal.value.toLocaleString("pt-BR")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}