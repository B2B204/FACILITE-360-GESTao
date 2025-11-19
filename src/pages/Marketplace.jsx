import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Fingerprint, FileSignature, BarChart, Briefcase, Bot, ShieldCheck } from 'lucide-react';

const services = [
  {
    icon: FileSignature,
    title: "Assinatura Digital (Clicksign/D4Sign)",
    description: "Envie recibos e medições para assinatura digital diretamente do sistema.",
    price: "A partir de R$ 99/mês",
    category: "Integração",
    premium: true,
  },
  {
    icon: Fingerprint,
    title: "Emissão de Certidões Automatizada",
    description: "Consulta e emissão automática de CNDs e outras certidões.",
    price: "R$ 79/mês",
    category: "Automação",
  },
  {
    icon: BarChart,
    title: "Módulo de Business Intelligence",
    description: "Dashboards avançados e relatórios personalizados para uma visão estratégica.",
    price: "R$ 149/mês",
    category: "Análise",
    premium: true,
  },
  {
    icon: Briefcase,
    title: "Integração com ERP (Omie/Conta Azul)",
    description: "Sincronize dados financeiros e fiscais com seu sistema de gestão.",
    price: "Sob consulta",
    category: "Integração",
    premium: true,
  },
  {
    icon: Bot,
    title: "Auditoria com Inteligência Artificial",
    description: "Rotinas de IA que verificam inconsistências e sugerem melhorias em seus contratos.",
    price: "R$ 199/mês",
    category: "Automação",
  },
   {
    icon: ShieldCheck,
    title: "Gestão de Treinamentos (NRs)",
    description: "Controle vencimentos e certificados de treinamentos obrigatórios para sua equipe.",
    price: "R$ 59/mês",
    category: "RH",
  }
];

export default function MarketplacePage() {
  const handlePurchase = (serviceTitle) => {
    alert(`O serviço "${serviceTitle}" é um recurso premium. A integração real requer a ativação de um plano superior e/ou configuração de backend. Entre em contato com nosso suporte para saber mais.`);
  };

  return (
    <div className="p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Marketplace de Serviços</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Turbine seu FaciliGestor360 com integrações e módulos poderosos para otimizar ainda mais sua operação.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service, index) => (
          <Card key={index} className="flex flex-col hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="flex-grow">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <service.icon className="w-6 h-6 text-blue-600" />
                </div>
                {service.premium && <Badge className="bg-purple-100 text-purple-800">Plano Pro</Badge>}
              </div>
              <CardTitle>{service.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-gray-600 mb-4">{service.description}</p>
              <div className="flex justify-between items-center text-sm">
                <Badge variant="outline">{service.category}</Badge>
                <span className="font-semibold">{service.price}</span>
              </div>
            </CardContent>
            <div className="p-6 pt-0">
              <Button className="w-full" onClick={() => handlePurchase(service.title)}>
                Adicionar ao meu sistema
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}