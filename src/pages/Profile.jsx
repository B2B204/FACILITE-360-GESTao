
import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { UserInvite } from "@/api/entities";
import { TeamMember } from "@/api/entities";
import { Contract } from "@/api/entities";
import { Employee } from "@/api/entities";
import { FinancialEntry } from "@/api/entities";
import { Measurement } from "@/api/entities";
import { Patrimony } from "@/api/entities";
import { Supply } from "@/api/entities";
import { IndirectCost } from "@/api/entities";
import { Uniform } from "@/api/entities";
import { UniformDelivery } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import UserInviteModal from "@/components/UserInviteModal";
import TrashManager from '@/components/common/TrashManager';
import DataRecovery from "@/components/common/DataRecovery";
import BackupManager from "@/components/common/BackupManager"; // NEW IMPORT
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Camera, Save, CheckCircle, Upload, Crown, Users, FileText, TrendingUp, ShieldCheck, UserPlus, DownloadCloud, Trash2, Send, Trash, Copy, Database } from "lucide-react";
import { format } from 'date-fns';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ contracts: 0, employees: 0, actualUsers: 0 });
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    cnpj: "",
    tax_regime: "simples_nacional",
    company_logo_url: "",
    company_name: "",
    company_address: "",
    cargo: "",
    matricula: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    const currentUser = await User.me();
    setUser(currentUser);
    
    // Assegura que o usuário seja carregado antes de outras chamadas
    if (currentUser) {
        setFormData({
            full_name: currentUser.full_name || "",
            phone: currentUser.phone || "",
            cnpj: currentUser.cnpj || "",
            tax_regime: currentUser.tax_regime || "simples_nacional",
            company_logo_url: currentUser.company_logo_url || "",
            company_name: currentUser.company_name || "",
            company_address: currentUser.company_address || "",
            cargo: currentUser.cargo || "",
            matricula: currentUser.matricula || ""
        });
        await Promise.all([
            loadTeamMembers(currentUser),
            loadPendingInvites(currentUser),
            loadStats(currentUser)
        ]);
    }
  };
  
  const loadStats = async (currentUser) => {
      // Carregar contratos e funcionários como antes
      const [contracts, employees] = await Promise.all([
        Contract.filter({ cnpj: currentUser.cnpj }),
        Employee.filter({ cnpj: currentUser.cnpj })
      ]);

      // NOVO: Contar usuários reais do sistema (que consomem licenças)
      let actualSystemUsers = 0;
      
      try {
        // Contar usuários da entidade User principal
        const mainUsers = await User.filter({ cnpj: currentUser.cnpj });
        actualSystemUsers += mainUsers.length;
        
        // Contar usuários ativos da entidade TeamMember
        const teamMembers = await TeamMember.filter({ cnpj: currentUser.cnpj, status: 'ativo' });
        actualSystemUsers += teamMembers.length;
      } catch (error) {
        console.warn("Erro ao contar usuários do sistema:", error);
        actualSystemUsers = 1; // Pelo menos o usuário atual
      }

      setStats({
        contracts: contracts.length,
        employees: employees.length, // Funcionários (não contam para o plano)
        actualUsers: actualSystemUsers // Usuários reais (contam para o plano)
      });
  };

  const loadPendingInvites = async (currentUser) => {
    if(currentUser.department === 'admin') {
      try {
        const invites = await UserInvite.filter({ cnpj: currentUser.cnpj, status: 'pendente' });
        // Filtrar convites expirados no lado do cliente
        const now = new Date();
        const validInvites = invites.filter(invite => invite.expires_at && new Date(invite.expires_at) > now);
        setPendingInvites(validInvites);
      } catch (error) {
        console.error("Erro ao carregar convites pendentes:", error);
      }
    }
  };

  const loadTeamMembers = async (currentUser) => {
    if(currentUser.department === 'admin') {
      try {
        // Carregar membros da entidade User padrão
        const usersFromBase = await User.filter({ cnpj: currentUser.cnpj });
        
        // Carregar membros da entidade TeamMember (todos os status)
        let teamMembersFromInvites = [];
        try {
          teamMembersFromInvites = await TeamMember.filter({ cnpj: currentUser.cnpj });
        } catch (error) {
          console.log("ℹ️ Entidade TeamMember não encontrada ou inacessível, usando apenas usuários base. Erro:", error.message);
        }
        
        // Combinar as duas listas, evitando duplicatas por email
        const allMembers = [...usersFromBase];
        
        teamMembersFromInvites.forEach(teamMember => {
          // Só adicionar se não existir um usuário com o mesmo email na lista de usuários base
          const existsInBase = usersFromBase.some(user => user.email === teamMember.email);
          if (!existsInBase) {
            // Transformar TeamMember no formato esperado para exibição, adicionando uma flag
            const memberAsUser = {
              id: teamMember.id,
              full_name: teamMember.full_name,
              email: teamMember.email,
              department: teamMember.department,
              created_date: teamMember.created_date,
              updated_date: teamMember.updated_date,
              status: teamMember.status || 'ativo', // Default to 'ativo' if status is not explicitly set
              // Adicionar flag para identificar que veio de convite
              from_invite: true
            };
            allMembers.push(memberAsUser);
          }
        });
        
        // Ensure all users have a 'status' field for consistent display logic
        // If a User from base doesn't explicitly have status, default to 'ativo' unless department is 'canceled'
        const normalizedMembers = allMembers.map(member => ({
            ...member,
            status: member.status || (member.department === 'canceled' ? 'inativo' : 'ativo')
        }));

        setTeamMembers(normalizedMembers);
        console.log(`✅ Carregados ${normalizedMembers.length} membros.`);
        
      } catch (error) {
        console.error("Erro ao carregar membros da equipe:", error);
      }
    }
  };

  const handleUpdateMemberRole = async (memberId, newDepartment) => {
    if (user.department !== 'admin') {
      alert('Apenas administradores podem alterar perfis de usuários.');
      return;
    }

    try {
      // Verificar se é um membro da base (User) ou de convite (TeamMember)
      const member = teamMembers.find(m => m.id === memberId);
      
      if (!member) {
        alert('Membro não encontrado.');
        return;
      }

      if (member.from_invite) {
        // Atualizar na entidade TeamMember
        await TeamMember.update(memberId, { department: newDepartment });
      } else {
        // Atualizar na entidade User
        await User.update(memberId, { department: newDepartment });
      }
      
      loadAllData();
      alert('Perfil do usuário atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil do usuário:', error);
      alert('Erro ao atualizar perfil do usuário.');
    }
  };

  const handleDeleteInvite = async (inviteId) => {
      if(window.confirm("Tem certeza que deseja cancelar este convite?")) {
          try {
              // Em vez de deletar, vamos marcar como cancelado para manter o histórico
              await UserInvite.update(inviteId, { status: 'cancelado' });
              loadAllData();
              alert("Convite cancelado.");
          } catch (error) {
              console.error("Erro ao cancelar convite:", error);
              alert("Não foi possível cancelar o convite.");
          }
      }
  };
  
  const handleCancelUser = async (member) => {
    const confirmMessage = `Tem certeza que deseja cancelar o acesso de "${member.full_name}"? 
    
Esta ação irá:
• Desativar o usuário no sistema
• Remover acesso aos dados da empresa
• O usuário não conseguirá mais fazer login

Você pode reativar este usuário posteriormente se necessário.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      console.log(`🔄 Cancelando usuário: ${member.full_name} (${member.email})`);

      if (member.from_invite) {
        // Se for um membro vindo de convite, atualizar na entidade TeamMember
        await TeamMember.update(member.id, { 
          status: 'inativo',
          deactivated_at: new Date().toISOString(),
          deactivated_by: user.email,
          deactivation_reason: 'Cancelado pelo administrador'
        });
        console.log("✅ Membro de convite desativado na entidade TeamMember");
      } else {
        // Se for um usuário da base, marcar como inativo
        await User.update(member.id, { 
          department: 'canceled', // Usar um department especial para cancelados
          status: 'inativo' // Se a entidade User tiver esse campo
        });
        console.log("✅ Usuário base marcado como cancelado");
      }

      // Recarregar a lista
      await loadAllData();
      alert(`✅ Usuário "${member.full_name}" foi cancelado com sucesso.`);
      
    } catch (error) {
      console.error("❌ Erro ao cancelar usuário:", error);
      alert(`❌ Erro ao cancelar usuário: ${error.message}`);
    }
  };

  const handleReactivateUser = async (member) => {
    const confirmMessage = `Reativar o usuário "${member.full_name}"? 
    
Esta ação irá:
• Restaurar o acesso ao sistema
• Permitir login novamente
• Definir função como "Visualização" (você pode alterar depois)`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      console.log(`🔄 Reativando usuário: ${member.full_name}`);

      if (member.from_invite) {
        await TeamMember.update(member.id, { 
          status: 'ativo',
          department: 'operador', // Função padrão ao reativar
          reactivated_at: new Date().toISOString(),
          reactivated_by: user.email
        });
      } else {
        await User.update(member.id, { 
          department: 'operador', // Função padrão ao reativar
          status: 'ativo'
        });
      }

      await loadAllData();
      alert(`✅ Usuário "${member.full_name}" foi reativado com sucesso.`);
      
    } catch (error) {
      console.error("❌ Erro ao reativar usuário:", error);
      alert(`❌ Erro ao reativar usuário: ${error.message}`);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;

    if(fileType === 'profile') setIsUploading(true);
    if(fileType === 'logo') setIsUploadingLogo(true);

    try {
      const { file_url } = await UploadFile({ file });
      const fieldToUpdate = fileType === 'profile' ? 'photo_url' : 'company_logo_url';
      await User.updateMyUserData({ [fieldToUpdate]: file_url });
      loadAllData();
      alert(`Sua ${fileType === 'profile' ? 'foto de perfil' : 'logo da empresa'} foi atualizada!`);
    } catch (error) {
      alert("Erro ao fazer upload.");
    }

    if(fileType === 'profile') setIsUploading(false);
    if(fileType === 'logo') setIsUploadingLogo(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.full_name || !formData.phone || !formData.cnpj || !formData.company_name || !formData.company_address || !formData.cargo || !formData.matricula) {
      alert("Por favor, preencha todos os campos obrigatórios (*).");
      return;
    }

    setIsSaving(true);
    try {
      await User.updateMyUserData(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      loadAllData();
    } catch (error) {
      alert("Erro ao atualizar perfil.");
    }
    setIsSaving(false);
  };

  const getPlanInfo = () => {
    const plans = {
      essencial: { name: "Essencial", price: "R$ 997/mês", limits: { contracts: 10, users: 5 }, color: "bg-green-100 text-green-800" },
      avancado: { name: "Avançado", price: "R$ 1.497/mês", limits: { contracts: 20, users: 10 }, color: "bg-blue-100 text-blue-800" },
      pro: { name: "Pro", price: "Sob consulta", limits: { contracts: "∞", users: "∞" }, color: "bg-purple-100 text-purple-800" },
      demo: { name: "Demonstração", price: "7 dias grátis", limits: { contracts: 5, users: 5 }, color: "bg-yellow-100 text-yellow-800" },
      none: { name: "Nenhum plano", price: "Escolha um plano", limits: { contracts: 0, users: 0 }, color: "bg-gray-100 text-gray-800" }
    };
    return plans[user?.plan || 'none'];
  };

  if (!user) {
    return (
      <div className="p-8 flex justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  const planInfo = getPlanInfo();
  const taxRegimeLabels = {
    simples_nacional: "Simples Nacional",
    lucro_presumido: "Lucro Presumido",
    lucro_real: "Lucro Real",
    outros: "Outros"
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
       <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Perfil da Empresa</h1>
        <p className="text-gray-600">Gerencie suas informações e acompanhe o uso do seu plano</p>
      </div>
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Crown className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center space-x-3">
                  <span className="text-xl font-bold text-gray-900">Plano {planInfo.name}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${planInfo.color}`}>
                    {planInfo.price}
                  </span>
                </div>
                <p className="text-gray-600 mt-1">
                  Limite: {planInfo.limits.contracts} contratos • {planInfo.limits.users} usuários
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate(createPageUrl("PricingPage"))}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Upgrade de Plano
            </Button>
          </div>
        </CardContent>
      </Card>
      
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contratos em uso</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.contracts} / {planInfo.limits.contracts}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${planInfo.limits.contracts === "∞" ? 20 : (stats.contracts / planInfo.limits.contracts) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usuários do Sistema</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.actualUsers} / {planInfo.limits.users}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${planInfo.limits.users === "∞" ? 20 : (stats.actualUsers / planInfo.limits.users) * 100}%`
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Admins + Gestores + RH + Financeiro</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Funcionários Cadastrados</p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.employees}
                </p>
                <p className="text-xs text-gray-500 mt-1">Não limitado pelo plano</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold">∞</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              👤
            </div>
            Informações do Perfil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-4">Foto de Perfil</h3>
              <div className="flex items-center space-x-6">
                <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                  <AvatarImage src={user.photo_url} />
                  <AvatarFallback className="text-3xl bg-blue-100 text-blue-700">
                    {user.full_name?.charAt(0) || <Camera className="w-8 h-8" />}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="photo_url" className="cursor-pointer">
                    <div className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors">
                      <Camera className="w-4 h-4" />
                      <span>{isUploading ? "Enviando..." : "Alterar Foto"}</span>
                    </div>
                  </Label>
                  <Input id="photo_url" type="file" className="hidden" onChange={(e) => handleFileChange(e, 'profile')} accept="image/*" disabled={isUploading} />
                  <p className="text-sm text-gray-500 mt-2">PNG, JPG, WEBP até 5MB</p>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 p-6 rounded-lg">
              <h3 className="font-semibold text-indigo-900 mb-4">Logo da Empresa *</h3>
              <div className="flex items-center space-x-6">
                {formData.company_logo_url ? (
                  <img src={formData.company_logo_url} alt="Logo da empresa" className="w-32 h-auto object-contain bg-white p-2 rounded-md border" />
                ) : (
                  <div className="w-32 h-24 border-2 border-dashed rounded-md flex items-center justify-center text-gray-400">
                    Sem logo
                  </div>
                )}
                <div>
                  <Label htmlFor="company_logo_url" className="cursor-pointer">
                    <div className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>{isUploadingLogo ? "Enviando..." : "Alterar Logo"}</span>
                    </div>
                  </Label>
                  <Input id="company_logo_url" type="file" className="hidden" onChange={(e) => handleFileChange(e, 'logo')} accept="image/*" disabled={isUploadingLogo} />
                  <p className="text-sm text-gray-500 mt-2">Obrigatório para gerar relatórios e recibos</p>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-6 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-4">Informações Empresariais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="company_name" className="text-sm font-medium text-gray-700">Nome da Empresa *</Label>
                  <Input id="company_name" name="company_name" value={formData.company_name} onChange={handleChange} required className="mt-1" placeholder="Nome da sua empresa" />
                </div>
                <div>
                  <Label htmlFor="cnpj" className="text-sm font-medium text-gray-700">CNPJ *</Label>
                  <Input id="cnpj" name="cnpj" value={formData.cnpj} onChange={handleChange} required className="mt-1" placeholder="00.000.000/0000-00" />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="company_address" className="text-sm font-medium text-gray-700">Endereço da Empresa *</Label>
                  <Input id="company_address" name="company_address" value={formData.company_address} onChange={handleChange} required className="mt-1" placeholder="Endereço completo" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Regime Tributário *</Label>
                  <Select value={formData.tax_regime} onValueChange={(v) => handleSelectChange("tax_regime", v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione o regime" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(taxRegimeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-4">Informações Pessoais e de Assinatura</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">Nome Completo *</Label>
                  <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleChange} required className="mt-1" placeholder="Seu nome completo" />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                  <Input id="email" value={user.email} disabled className="mt-1 bg-gray-100" />
                  <p className="text-xs text-gray-500 mt-1">Email não pode ser alterado</p>
                </div>
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Telefone *</Label>
                  <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required className="mt-1" placeholder="(11) 99999-9999" />
                </div>
                <div>
                  <Label htmlFor="cargo" className="text-sm font-medium text-gray-700">Cargo / Função *</Label>
                  <Input id="cargo" name="cargo" value={formData.cargo} onChange={handleChange} required className="mt-1" placeholder="Ex: Diretor de Contratos" />
                </div>
                <div>
                  <Label htmlFor="matricula" className="text-sm font-medium text-gray-700">Matrícula Funcional *</Label>
                  <Input id="matricula" name="matricula" value={formData.matricula} onChange={handleChange} required className="mt-1" placeholder="Ex: 001234" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Nível de Acesso</Label>
                  <Input value={user.department?.toUpperCase() || 'ADMIN'} disabled className="mt-1 bg-gray-100 capitalize" />
                </div>
              </div>
            </div>
            
             <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Informações do Sistema</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Data de Cadastro</Label>
                  <Input value={user.created_date ? new Date(user.created_date).toLocaleDateString('pt-BR') : 'Não disponível'} disabled className="mt-1 bg-gray-100" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Última Atualização</Label>
                  <Input value={user.updated_date ? new Date(user.updated_date).toLocaleDateString('pt-BR') : 'Não disponível'} disabled className="mt-1 bg-gray-100" />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t">
              <Button type="submit" disabled={isSaving} className={`px-8 py-3 ${saveSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                {isSaving ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Salvando...</>) : saveSuccess ? (<><CheckCircle className="w-4 h-4 mr-2" />Salvo com Sucesso!</>) : (<><Save className="w-4 h-4 mr-2" />Salvar Alterações</>)}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* User Management Card (apenas para admins) */}
      {user.department === 'admin' && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <ShieldCheck className="w-6 h-6 mr-3 text-blue-600" />
                Gestão de Usuários
              </CardTitle>
              <Button variant="outline" onClick={() => setIsInviteModalOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Adicionar Membro
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Convites Pendentes */}
            {pendingInvites.length > 0 && (
                <div className="mb-8">
                    <h4 className="text-lg font-semibold mb-3 text-gray-800">Convites Pendentes</h4>
                    <div className="space-y-2">
                        {pendingInvites.map(invite => (
                            <div key={invite.id} className="flex flex-wrap items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200 gap-2">
                                <div>
                                    <p className="font-medium text-yellow-900">{invite.full_name}</p>
                                    <p className="text-sm text-yellow-800">{invite.email}</p>
                                    <p className="text-xs text-yellow-700 mt-1">Expira em: {format(new Date(invite.expires_at), 'dd/MM/yyyy HH:mm')}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button size="sm" variant="outline" onClick={() => {
                                        const link = `${window.location.origin}/AcceptInvite?code=${invite.invite_code}`;
                                        navigator.clipboard.writeText(link);
                                        alert("Link de convite copiado!");
                                    }}>
                                        <Copy className="w-4 h-4 mr-2" /> Copiar Link
                                    </Button>
                                    <Button size="icon" variant="destructive" onClick={() => handleDeleteInvite(invite.id)} title="Cancelar convite">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Tabela de Membros Ativos */}
            <h4 className="text-lg font-semibold mb-3 text-gray-800">Membros da Equipe</h4>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamMembers.length > 0 ? (
                    teamMembers.map(member => {
                      const isInactive = member.status === 'inativo' || member.department === 'canceled';
                      const isSelf = member.email === user.email;
                      
                      return (
                        <TableRow key={member.id} className={isInactive ? 'opacity-60 bg-gray-50' : ''}>
                          <TableCell className="font-medium">
                            {member.full_name}
                            {isSelf && <span className="text-xs text-blue-600 ml-2">(Você)</span>}
                          </TableCell>
                          <TableCell>{member.email}</TableCell>
                          <TableCell>
                            <Badge variant={isInactive ? "secondary" : "default"} className="capitalize">
                              {isInactive ? 'Cancelado' : (
                                member.department === 'admin' ? 'Administrador' :
                                member.department === 'gestor' ? 'Gestor' :
                                member.department === 'financeiro' ? 'Financeiro' :
                                member.department === 'rh' ? 'RH' : 'Visualização'
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={isInactive ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                              {isInactive ? 'Inativo' : 'Ativo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {!isSelf && !isInactive && (
                                <Select
                                  value={member.department || 'operador'}
                                  onValueChange={(newDepartment) => handleUpdateMemberRole(member.id, newDepartment)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                    <SelectItem value="gestor">Gestor</SelectItem>
                                    <SelectItem value="financeiro">Financeiro</SelectItem>
                                    <SelectItem value="rh">RH</SelectItem>
                                    <SelectItem value="operador">Visualização</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                              
                              {!isSelf && (
                                <div className="flex space-x-1">
                                  {!isInactive ? (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleCancelUser(member)}
                                      title="Cancelar usuário"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleReactivateUser(member)}
                                      title="Reativar usuário"
                                      className="text-green-600 hover:text-green-800"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              )}
                              
                              {isSelf && (
                                <span className="text-sm text-gray-500">-</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                        Nenhum membro na equipe.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {user.department === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DownloadCloud className="w-6 h-6 mr-3 text-blue-600" />
              Backup de Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BackupManager user={user} />
          </CardContent>
        </Card>
      )}

      {user.department === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trash className="w-6 h-6 mr-3 text-red-600" />
              Ferramentas de Administração
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Trash className="w-4 h-4 mr-2" />
                  Lixeira de Posts
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Gerenciador de Lixeira</DialogTitle>
                </DialogHeader>
                <TrashManager user={user} />
              </DialogContent>
            </Dialog>

            {/* Novo: Recuperação de Dados (Contratos) */}
            <div className="mt-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Database className="w-4 h-4 mr-2" />
                    Recuperar Dados (Contratos)
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Recuperar Dados de Contratos</DialogTitle>
                  </DialogHeader>
                  <DataRecovery user={user} />
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <div className="text-2xl">💡</div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Dicas para seu Perfil</h3>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Mantenha suas informações sempre atualizadas</li>
                <li>• O logo da empresa é obrigatório para gerar relatórios e recibos</li>
                <li>• O regime tributário correto é importante para os cálculos</li>
                <li>• Acompanhe o uso do seu plano para evitar atingir os limites</li>
                <li>• Em caso de dúvidas, consulte nossa central de ajuda</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <UserInviteModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          currentUser={user}
          onSuccess={loadAllData}
      />
    </div>
  );
}
