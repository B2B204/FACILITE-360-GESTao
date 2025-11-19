import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { TeamMember } from '@/api/entities';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, Target, Building, Phone, Calendar, 
  TrendingUp, DollarSign, Percent, Award, 
  Loader2, AlertCircle 
} from 'lucide-react';
import { canAccessCRM, canViewAllDeals } from '@/components/permissions';
import LeadsTab from '@/components/crm/LeadsTab';
import ContactsTab from '@/components/crm/ContactsTab';
import CompaniesTab from '@/components/crm/CompaniesTab';
import DealsTab from '@/components/crm/DealsTab';
import ActivitiesTab from '@/components/crm/ActivitiesTab';
import CrmDashboard from '@/components/crm/CrmDashboard';

export default function CRMPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const currentUser = await User.me();
      if (!currentUser) {
        throw new Error("Usuário não autenticado");
      }

      // Determinar CNPJ
      let userCnpj = currentUser.cnpj;
      if (!userCnpj) {
        const teamMembers = await TeamMember.filter({ email: currentUser.email });
        if (teamMembers && teamMembers.length > 0) {
          userCnpj = teamMembers[0].cnpj;
        }
      }
      
      if (!userCnpj) {
        throw new Error("Não foi possível determinar o CNPJ da empresa");
      }

      // Verificar permissão de acesso ao CRM
      if (!canAccessCRM(currentUser.department)) {
        throw new Error("Você não tem permissão para acessar o CRM");
      }

      const userWithCnpj = { ...currentUser, cnpj: userCnpj };
      setUser(userWithCnpj);
      
    } catch (err) {
      console.error("❌ Erro ao carregar usuário:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Erro de Acesso</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">CRM - Gestão de Relacionamento</h1>
          <p className="text-gray-600">Gerencie leads, negócios e relacionamento com clientes</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            {user?.department === 'admin' ? 'Administrador' : 
             user?.department === 'gestor' ? 'Gestor' : 'Comercial'}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Leads
          </TabsTrigger>
          <TabsTrigger value="deals" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Negócios
          </TabsTrigger>
          <TabsTrigger value="companies" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Empresas
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Contatos
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Atividades
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <CrmDashboard user={user} />
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          <LeadsTab user={user} />
        </TabsContent>

        <TabsContent value="deals" className="space-y-6">
          <DealsTab user={user} />
        </TabsContent>

        <TabsContent value="companies" className="space-y-6">
          <CompaniesTab user={user} />
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          <ContactsTab user={user} />
        </TabsContent>

        <TabsContent value="activities" className="space-y-6">
          <ActivitiesTab user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}