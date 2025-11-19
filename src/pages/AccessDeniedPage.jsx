import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

export default function AccessDeniedPage() {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-[450px] shadow-lg text-center">
        <CardHeader>
          <ShieldAlert className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <CardTitle className="text-2xl font-bold">Acesso Negado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-600">
            Você não tem permissão para acessar esta página. Seu perfil de usuário atual não inclui acesso a este módulo.
          </p>
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate(createPageUrl("Dashboard"))}
          >
            Voltar para o Dashboard
          </Button>
          <p className="text-xs text-gray-500">
            Se você acredita que isso é um erro, por favor, entre em contato com o administrador do sistema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}