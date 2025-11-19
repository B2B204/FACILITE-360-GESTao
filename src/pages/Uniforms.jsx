
import React, { useState, useEffect, useCallback } from 'react';
import { Uniform } from '@/api/entities';
import { UniformDelivery } from '@/api/entities';
import { Contract } from '@/api/entities';
import { Employee } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  Package, Plus, Search, AlertTriangle, TrendingUp, DollarSign,
  Calendar, Users, Shirt, Clock, CheckCircle, Receipt, Trash2, Truck
} from 'lucide-react';
import UniformForm from '../components/uniforms/UniformForm';
import UniformDeliveryForm from '../components/uniforms/UniformDeliveryForm';
import UniformList from '../components/uniforms/UniformList';
import UniformDashboard from '../components/uniforms/UniformDashboard';
import { canPerformAction } from '@/components/permissions';

export default function UniformsPage() {
  const [user, setUser] = useState(null);
  const [uniforms, setUniforms] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    totalUniforms: 0,
    totalCost: 0,
    expiringItems: 0,
    pendingEmployees: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUniformFormOpen, setIsUniformFormOpen] = useState(false);
  const [isDeliveryFormOpen, setIsDeliveryFormOpen] = useState(false);
  const [selectedUniform, setSelectedUniform] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  const userRole = user?.department || 'operador';

  const calculateDashboard = useCallback((uniformsData, deliveriesData, employeesData) => {
    const totalUniforms = deliveriesData.reduce((sum, d) => sum + (d.quantity || 0), 0);
    const totalCost = deliveriesData.reduce((sum, d) => sum + (d.total_cost || 0), 0);

    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    const expiringItems = deliveriesData.filter(d => {
      if (!d.expiry_date || d.status !== 'em_uso') return false;
      const expiryDate = new Date(d.expiry_date);
      return expiryDate <= thirtyDaysFromNow && expiryDate >= today;
    }).length;

    const employeesWithUniforms = new Set(deliveriesData.map(d => d.employee_id));
    const pendingEmployees = employeesData.filter(e => !employeesWithUniforms.has(e.id)).length;

    setDashboardData({
      totalUniforms,
      totalCost,
      expiringItems,
      pendingEmployees
    });
  }, [setDashboardData]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const [uniformsData, deliveriesData, contractsData, employeesData] = await Promise.all([
        Uniform.filter({ cnpj: currentUser.cnpj }, '-created_date'),
        UniformDelivery.filter({ cnpj: currentUser.cnpj }, '-created_date'),
        Contract.filter({ cnpj: currentUser.cnpj, status: 'ativo' }),
        Employee.filter({ cnpj: currentUser.cnpj, status: 'ativo' })
      ]);

      setUniforms(uniformsData);
      setDeliveries(deliveriesData);
      setContracts(contractsData);
      setEmployees(employeesData);
      calculateDashboard(uniformsData, deliveriesData, employeesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
    setIsLoading(false);
  }, [calculateDashboard, setUser, setUniforms, setDeliveries, setContracts, setEmployees, setIsLoading]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUniformSave = async (formData) => {
    try {
      const dataToSave = { ...formData, cnpj: user.cnpj };

      if (selectedUniform) {
        await Uniform.update(selectedUniform.id, dataToSave);
      } else {
        await Uniform.create(dataToSave);
      }

      await loadData();
      setIsUniformFormOpen(false);
      setSelectedUniform(null);
    } catch (error) {
      console.error('Erro ao salvar uniforme:', error);
      alert('Erro ao salvar uniforme. Verifique os dados.');
    }
  };

  const handleDeliverySave = async (formData) => {
    try {
      const uniform = uniforms.find(u => u.id === formData.uniform_id);
      const totalCost = (formData.quantity || 0) * (uniform?.unit_cost || 0);

      // Calcular data de vencimento
      const deliveryDate = new Date(formData.delivery_date);
      const expiryDate = new Date(deliveryDate);
      expiryDate.setMonth(expiryDate.getMonth() + (uniform?.validity_months || 12));

      const dataToSave = {
        ...formData,
        total_cost: totalCost,
        expiry_date: expiryDate.toISOString().split('T')[0],
        cnpj: user.cnpj
      };

      await UniformDelivery.create(dataToSave);
      await loadData();
      setIsDeliveryFormOpen(false);
    } catch (error) {
      console.error('Erro ao registrar entrega:', error);
      alert('Erro ao registrar entrega. Verifique os dados.');
    }
  };

  const handleOpenForm = (type) => {
    if (type === 'uniform') {
      setSelectedUniform(null); // Ensure no uniform is selected for new form
      setIsUniformFormOpen(true);
    } else if (type === 'delivery') {
      setIsDeliveryFormOpen(true);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const generateUniformReceipt = async (delivery) => {
    try {
      const uniform = uniforms.find(u => u.id === delivery.uniform_id);
      const employee = employees.find(e => e.id === delivery.employee_id);
      const contract = contracts.find(c => c.id === delivery.contract_id);

      if (!uniform || !employee || !contract) {
        alert("Erro: Dados incompletos para gerar o recibo.");
        return;
      }

      const companyName = user?.company_name || "Empresa";
      const companyCnpj = user?.cnpj || "";
      const companyAddress = user?.company_address || "";
      const logo = user?.company_logo_url || "";
      const issuerName = user?.full_name || "";
      const issuerCargo = user?.cargo || "";
      const issuerMatricula = user?.matricula || "";

      const formatDateBR = (d) => (d ? new Date(d).toLocaleDateString('pt-BR') : "");
      const fileName = `Recibo_Uniforme_${employee.name.replace(/\s+/g, '_')}_${formatDateBR(delivery.delivery_date).replace(/\//g, '-')}.html`;

      const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Recibo de Entrega de Uniforme - ${employee.name}</title>
<style>
  @page { size: A4; margin: 2cm; }
  :root { --text:#222; --muted:#6b7280; --line:#e5e7eb; --primary:#1d4ed8; }
  html, body { margin:0; padding:0; color:var(--text); -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  body { font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background:#f8fafc; }
  .page { max-width:21cm; margin:0 auto; background:white; box-shadow:0 0 10px rgba(0,0,0,.08); }
  .wrap { padding:2cm; }
  .header { display:flex; align-items:center; gap:16px; padding-bottom:10px; border-bottom:1px solid var(--line); }
  .logo { width:72px; height:72px; display:flex; align-items:center; justify-content:center; }
  .logo img { max-width:100%; max-height:72px; object-fit:contain; }
  .company { flex:1; }
  .company h1 { font-size:18px; margin:0; line-height:1.2; letter-spacing:.2px; }
  .company p { margin:2px 0 0; color:var(--muted); font-size:12px; }
  .title { text-align:center; margin:18px 0 6px; font-size:18px; font-weight:700; color:#111827; }
  .subtitle { text-align:center; color:var(--muted); font-size:12px; margin-bottom:18px; }
  .meta { display:flex; justify-content:space-between; gap:16px; font-size:12px; margin-bottom:16px; }
  .card { border:1px solid var(--line); border-radius:10px; overflow:hidden; margin-bottom:14px; }
  .card h3 { margin:0; padding:10px 12px; background:#f3f4f6; border-bottom:1px solid var(--line); font-size:13px; }
  .card .content { padding:12px; font-size:13px; }
  .grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .row { display:flex; justify-content:space-between; gap:10px; padding:6px 0; border-bottom:1px dashed var(--line); }
  .row:last-child { border-bottom:none; }
  .label { color:var(--muted); }
  .value { font-weight:600; color:#111827; }
  .table { width:100%; border-collapse:collapse; font-size:13px; }
  .table th, .table td { border:1px solid var(--line); padding:8px; text-align:left; }
  .table th { background:#f3f4f6; }
  .signs { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:18px; }
  .sign { text-align:center; margin-top:28px; }
  .sign .line { border-top:1px solid #111827; margin-top:40px; padding-top:6px; font-size:12px; }
  .footer { margin-top:18px; font-size:11px; color:var(--muted); text-align:center; }
  @media print { .page { box-shadow:none; } body { background:white; } }
</style>
</head>
<body>
  <div class="page">
    <div class="wrap">
      <div class="header">
        <div class="logo">${logo ? `<img src="${logo}" alt="Logo" />` : ""}</div>
        <div class="company">
          <h1>${companyName}</h1>
          <p>${companyAddress || ""}</p>
          <p>${companyCnpj ? `CNPJ: ${companyCnpj}` : ""}</p>
        </div>
      </div>

      <div class="title">Recibo de Entrega de Uniforme/EPI</div>
      <div class="subtitle">Comprovante de entrega ao colaborador</div>

      <div class="meta">
        <div><strong>Contrato:</strong> ${contract?.name || "-"}</div>
        <div><strong>Data:</strong> ${formatDateBR(delivery.delivery_date)}</div>
      </div>

      <div class="card">
        <h3>Dados do Colaborador</h3>
        <div class="content grid">
          <div class="row"><span class="label">Nome</span><span class="value">${employee?.name || "-"}</span></div>
          <div class="row"><span class="label">Função</span><span class="value">${employee?.role || "-"}</span></div>
          <div class="row"><span class="label">CPF</span><span class="value">${employee?.cpf || "-"}</span></div>
          <div class="row"><span class="label">Contrato</span><span class="value">${contract?.name || "-"}</span></div>
        </div>
      </div>

      <div class="card">
        <h3>Item Entregue</h3>
        <div class="content">
          <table class="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Categoria</th>
                <th>Tamanho</th>
                <th>Quantidade</th>
                <th>Custo Unitário</th>
                <th>Custo Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${uniform?.item_name || "-"}</td>
                <td>${uniform?.category || "-"}</td>
                <td>${uniform?.size || "-"}</td>
                <td>${delivery.quantity || 0}</td>
                <td>${formatCurrency(uniform?.unit_cost)}</td>
                <td>${formatCurrency(delivery.total_cost)}</td>
              </tr>
            </tbody>
          </table>
          <div class="grid" style="margin-top:10px;">
            <div class="row"><span class="label">Situação</span><span class="value">${(delivery.status || "").replace('_', ' ')}</span></div>
            <div class="row"><span class="label">Validade prevista</span><span class="value">${formatDateBR(delivery.expiry_date) || "-"}</span></div>
          </div>
        </div>
      </div>

      ${delivery.delivery_observations ? `
      <div class="card">
        <h3>Observações</h3>
        <div class="content">
          <div>${delivery.delivery_observations || ""}</div>
        </div>
      </div>` : ""}

      <div class="signs">
        <div class="sign">
          <div class="line">Assinatura do Colaborador</div>
          <div style="font-size:12px; color:var(--muted);">
            ${employee?.name || "-"}
          </div>
        </div>
        <div class="sign">
          <div class="line">Assinatura da Empresa</div>
          <div style="font-size:12px; color:var(--muted);">
            ${issuerName || companyName}${issuerCargo ? ` • ${issuerCargo}` : ""}${issuerMatricula ? ` • Matrícula: ${issuerMatricula}` : ""}
          </div>
        </div>
      </div>

      <div class="footer">
        Documento gerado eletronicamente em ${new Date().toLocaleString('pt-BR')}. Guarde este recibo para conferência.
      </div>
    </div>
  </div>
  <script>
    // Abre diálogo de impressão automaticamente quando aberto em nova aba
    window.addEventListener('load', () => {
      try { window.print(); } catch(e) {}
    });
  </script>
</body>
</html>`.trim();

      // 1) Abrir em nova aba para imprimir ou salvar em PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
      }

      // 2) Disponibilizar download do HTML gerado
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Erro ao gerar recibo:", error);
      alert("Erro ao gerar recibo de uniforme.");
    }
  };

  const handleDeleteDelivery = async (deliveryId) => {
    if (window.confirm('Tem certeza que deseja excluir esta entrega de uniforme? Esta ação não pode ser desfeita.')) {
      try {
        await UniformDelivery.delete(deliveryId);
        await loadData();
        alert('Entrega de uniforme excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir entrega:', error);
        alert('Erro ao excluir entrega de uniforme.');
      }
    }
  };

  const handleBaixaFuncional = async (deliveryId) => {
    if (window.confirm('Confirmar baixa funcional deste uniforme? O status será alterado para "devolvido".')) {
      try {
        await UniformDelivery.update(deliveryId, {
          status: 'devolvido',
          return_date: new Date().toISOString().split('T')[0]
        });
        await loadData();
        alert('Baixa funcional registrada com sucesso!');
      } catch (error) {
        console.error('Erro ao registrar baixa funcional:', error);
        alert('Erro ao registrar baixa funcional.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Uniformes e EPIs</h1>
          <p className="text-gray-600">Controle o catálogo de itens e as entregas para sua equipe.</p>
        </div>
        <div className="flex gap-2">
          {canPerformAction(userRole, 'create') && (
            <>
              <Button variant="outline" onClick={() => handleOpenForm('delivery')}>
                <Truck className="w-4 h-4 mr-2" /> Nova Entrega
              </Button>
              <Button onClick={() => handleOpenForm('uniform')} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" /> Novo Item no Catálogo
              </Button>
            </>
          )}
        </div>
      </div>

      <Dialog open={isUniformFormOpen} onOpenChange={setIsUniformFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedUniform ? 'Editar Uniforme' : 'Novo Uniforme'}
            </DialogTitle>
          </DialogHeader>
          <UniformForm
            uniform={selectedUniform}
            onSave={handleUniformSave}
            onCancel={() => {
              setIsUniformFormOpen(false);
              setSelectedUniform(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDeliveryFormOpen} onOpenChange={setIsDeliveryFormOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Nova Entrega de Uniforme</DialogTitle>
          </DialogHeader>
          <UniformDeliveryForm
            contracts={contracts}
            employees={employees}
            uniforms={uniforms}
            onSave={handleDeliverySave}
            onCancel={() => setIsDeliveryFormOpen(false)}
          />
        </DialogContent>
      </Dialog>


      {/* Abas Principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="uniforms">Uniformes</TabsTrigger>
          <TabsTrigger value="deliveries">Entregas</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <UniformDashboard
            dashboardData={dashboardData}
            deliveries={deliveries}
            uniforms={uniforms}
            employees={employees}
            contracts={contracts}
          />
        </TabsContent>

        <TabsContent value="uniforms" className="mt-6">
          <UniformList
            uniforms={uniforms}
            onEdit={(uniform) => {
              setSelectedUniform(uniform);
              setIsUniformFormOpen(true);
            }}
            onDataChange={loadData}
          />
        </TabsContent>

        <TabsContent value="deliveries" className="mt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Histórico de Entregas</h3>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Buscar por funcionário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>

            {/* Lista de Entregas */}
            <div className="grid gap-4">
              {deliveries
                .filter(delivery => {
                  const employee = employees.find(e => e.id === delivery.employee_id);
                  return employee?.name.toLowerCase().includes(searchTerm.toLowerCase());
                })
                .map((delivery) => {
                  const uniform = uniforms.find(u => u.id === delivery.uniform_id);
                  const employee = employees.find(e => e.id === delivery.employee_id);
                  const contract = contracts.find(c => c.id === delivery.contract_id);

                  const isExpiring = delivery.expiry_date &&
                    new Date(delivery.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                  return (
                    <Card key={delivery.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{employee?.name}</h4>
                            <Badge variant="outline">{contract?.name}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {uniform?.item_name} - Tamanho {uniform?.size} - Qtd: {delivery.quantity}
                          </p>
                          <div className="flex gap-4 text-xs text-gray-500">
                            <span>Entregue: {new Date(delivery.delivery_date).toLocaleDateString()}</span>
                            {delivery.expiry_date && (
                              <span className={isExpiring ? 'text-red-600 font-medium' : ''}>
                                Vence: {new Date(delivery.expiry_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <Badge className={
                            delivery.status === 'em_uso' ? 'bg-green-100 text-green-800' :
                            delivery.status === 'danificado' ? 'bg-red-100 text-red-800' :
                            delivery.status === 'devolvido' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {delivery.status.replace('_', ' ')}
                          </Badge>
                          <p className="text-sm font-medium">{formatCurrency(delivery.total_cost)}</p>
                          {isExpiring && (
                            <div className="flex items-center text-xs text-red-600">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Vencendo
                            </div>
                          )}

                          {/* Ações */}
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => generateUniformReceipt(delivery)}
                              className="flex items-center gap-1 text-xs"
                            >
                              <Receipt className="w-3 h-3" />
                              Recibo PDF
                            </Button>

                            {delivery.status === 'em_uso' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBaixaFuncional(delivery.id)}
                                className="flex items-center gap-1 text-xs bg-blue-50 hover:bg-blue-100"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Baixa Funcional
                              </Button>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteDelivery(delivery.id)}
                              className="flex items-center gap-1 text-xs text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                              Excluir
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{dashboardData.totalUniforms}</div>
                <p className="text-sm text-gray-600">Uniformes Entregues</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{formatCurrency(dashboardData.totalCost)}</div>
                <p className="text-sm text-gray-600">Custo Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600">{dashboardData.expiringItems}</div>
                <p className="text-sm text-gray-600">Vencendo em 30 dias</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">{dashboardData.pendingEmployees}</div>
                <p className="text-sm text-gray-600">Sem Uniforme</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
