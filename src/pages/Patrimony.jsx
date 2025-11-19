
import React, { useState, useEffect } from 'react';
import { Patrimony } from '@/api/entities';
import { PatrimonyMovement } from '@/api/entities';
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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Package, Plus, Search, Eye, Edit, Trash2, AlertTriangle, 
  TrendingUp, DollarSign, Calendar, MoreVertical, Download,
  FileText, ShieldCheck, Truck, Settings, History, QrCode
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import PatrimonyForm from '../components/patrimony/PatrimonyForm';
import PatrimonyView from '../components/patrimony/PatrimonyView';
import PatrimonyReport from '../components/patrimony/PatrimonyReport';
import { canPerformAction } from '@/components/permissions';
import QrCodeGenerator from '../components/patrimony/QrCodeGenerator';

export default function PatrimonyPage() {
  const [user, setUser] = useState(null);
  const [patrimonies, setPatrimonies] = useState([]);
  const [movements, setMovements] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    totalEquipments: 0,
    totalValue: 0,
    pendingReturns: 0,
    equipmentsInUse: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [editingPatrimony, setEditingPatrimony] = useState(null);
  const [viewingPatrimony, setViewingPatrimony] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [contractFilter, setContractFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('equipments'); // Changed initial state to 'equipments'
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedPatrimonyForQr, setSelectedPatrimonyForQr] = useState(null);

  const userRole = user?.department || 'operador';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const [patrimonyData, contractsData, employeesData, movementsData] = await Promise.all([
        Patrimony.filter({ cnpj: currentUser.cnpj }, '-created_date'),
        Contract.filter({ cnpj: currentUser.cnpj, status: 'ativo' }),
        Employee.filter({ cnpj: currentUser.cnpj, status: 'ativo' }),
        PatrimonyMovement.filter({ cnpj: currentUser.cnpj }, '-created_date')
      ]);

      setPatrimonies(patrimonyData);
      setMovements(movementsData);
      setContracts(contractsData);
      setEmployees(employeesData);
      calculateDashboard(patrimonyData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
    setIsLoading(false);
  };

  const calculateDashboard = (patrimoniesData) => {
    const totalEquipments = patrimoniesData.length;
    const totalValue = patrimoniesData.reduce((sum, p) => sum + (p.equipment_value || 0), 0);
    const equipmentsInUse = patrimoniesData.filter(p => p.status === 'em_uso').length;
    
    // Equipamentos com devolução atrasada
    const today = new Date();
    const pendingReturns = patrimoniesData.filter(p => 
      p.status === 'em_uso' && 
      p.expected_return_date && 
      new Date(p.expected_return_date) < today
    ).length;

    setDashboardData({
      totalEquipments,
      totalValue,
      pendingReturns,
      equipmentsInUse
    });
  };

  const handleSave = async (data) => {
    try {
      // Se 'data' for array (múltiplos equipamentos para bulk create)
      if (Array.isArray(data)) {
        const dataToSave = data.map(item => ({ ...item, cnpj: user.cnpj }));
        // Assuming Patrimony.bulkCreate handles initial movement creation on backend
        await Patrimony.bulkCreate(dataToSave); 
        alert(`${data.length} equipamento(s) cadastrado(s) com sucesso!`);
      } else {
        // Edição ou criação de um único equipamento
        const dataToSave = { ...data, cnpj: user.cnpj };
        
        if (editingPatrimony) {
          await Patrimony.update(editingPatrimony.id, dataToSave);
          
          // Registrar movimentação de manutenção
          await PatrimonyMovement.create({
            patrimony_id: editingPatrimony.id,
            movement_type: 'manutencao',
            movement_date: new Date().toISOString().split('T')[0],
            responsible_user: user.email,
            observations: 'Dados atualizados via sistema',
            cnpj: user.cnpj
          });
          alert('Equipamento atualizado com sucesso!');
        } else {
          const newPatrimony = await Patrimony.create(dataToSave);
          
          // Registrar movimentação de alocação
          await PatrimonyMovement.create({
            patrimony_id: newPatrimony.id,
            movement_type: 'alocacao',
            to_contract_id: data.contract_id,
            movement_date: data.allocation_date,
            responsible_user: user.email,
            observations: 'Alocação inicial do equipamento',
            cnpj: user.cnpj
          });
          alert('Equipamento cadastrado com sucesso!');
        }
      }
      
      await loadData();
      setIsFormOpen(false);
      setEditingPatrimony(null);
    } catch (error) {
      console.error('Erro ao salvar equipamento:', error);
      alert('Erro ao salvar equipamento. Verifique os dados.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este equipamento? Esta ação não pode ser desfeita.')) {
      try {
        await Patrimony.delete(id);
        await loadData();
        alert('Equipamento excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir equipamento:', error);
        alert('Erro ao excluir equipamento.');
      }
    }
  };

  const handleStatusChange = async (patrimonyId, newStatus) => {
    try {
      const patrimony = patrimonies.find(p => p.id === patrimonyId);
      const updates = { status: newStatus };
      
      if (newStatus === 'devolvido' && !patrimony.actual_return_date) {
        updates.actual_return_date = new Date().toISOString().split('T')[0];
      }
      
      await Patrimony.update(patrimonyId, updates);
      
      // Registrar movimentação
      await PatrimonyMovement.create({
        patrimony_id: patrimonyId,
        movement_type: newStatus === 'devolvido' ? 'devolucao' : 'manutencao',
        movement_date: new Date().toISOString().split('T')[0],
        responsible_user: user.email,
        observations: `Status alterado para: ${newStatus}`,
        cnpj: user.cnpj
      });
      
      await loadData();
      alert('Status atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status.');
    }
  };

  const handleFormOpen = (patrimonyToEdit = null) => {
    setEditingPatrimony(patrimonyToEdit);
    setIsFormOpen(true);
  };

  const handleGenerateQr = async (patrimony) => {
    try {
      await PatrimonyMovement.create({
        patrimony_id: patrimony.id,
        movement_type: 'geracao_qr',
        movement_date: new Date().toISOString(),
        responsible_user: user.email,
        observations: `QR Code gerado para o equipamento com serial ${patrimony.serial_number}.`,
        cnpj: user.cnpj,
      });
      console.log('Movimentação de geração de QR registrada.');
    } catch(err) {
      console.error('Falha ao registrar movimentação de QR Code:', err);
    }
  };

  const openQrModal = (items) => {
    const validItems = (Array.isArray(items) ? items : [items]).filter(p => p.serial_number);
    if(validItems.length === 0) {
      alert('Nenhum dos equipamentos selecionados possui número de série para gerar QR Code.');
      return;
    }
    setSelectedPatrimonyForQr(validItems);
    setIsQrModalOpen(true);
  };
  
  const filteredPatrimonies = patrimonies.filter(patrimony => {
    const matchesSearch = patrimony.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patrimony.serial_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || patrimony.status === statusFilter;
    const matchesContract = contractFilter === 'all' || patrimony.contract_id === contractFilter;
    
    return matchesSearch && matchesStatus && matchesContract;
  });

  const formatCurrency = (value) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const statusColors = {
    em_uso: 'bg-green-100 text-green-800',
    devolvido: 'bg-blue-100 text-blue-800',
    pendente: 'bg-yellow-100 text-yellow-800',
    extraviado: 'bg-red-100 text-red-800',
    manutencao: 'bg-orange-100 text-orange-800'
  };

  const statusLabels = {
    em_uso: 'Em Uso',
    devolvido: 'Devolvido',
    pendente: 'Pendente',
    extraviado: 'Extraviado',
    manutencao: 'Manutenção'
  };

  const equipmentTypes = {
    ferramenta: 'Ferramenta',
    maquinario: 'Maquinário',
    epi: 'EPI',
    mobiliario: 'Mobiliário',
    eletronico: 'Eletrônico',
    veiculo: 'Veículo',
    outros: 'Outros'
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
      {/* Abas Principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center border-b">
          <TabsList className="grid grid-cols-4 flex-grow">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="equipments">Equipamentos</TabsTrigger>
            <TabsTrigger value="movements">Movimentações</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>
          <div className="p-2 flex-shrink-0">
            {canPerformAction(userRole, 'create') && (
              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => handleFormOpen(null)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Equipamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
                  <DialogHeader className="flex-shrink-0 pb-4 border-b">
                    <DialogTitle className="text-xl font-semibold">
                      {editingPatrimony ? '✏️ Editar Equipamento' : '➕ Novo Equipamento'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto px-1">
                    <PatrimonyForm
                      isEditing={!!editingPatrimony}
                      patrimony={editingPatrimony}
                      contracts={contracts}
                      onSave={handleSave}
                      onCancel={() => {
                        setIsFormOpen(false);
                        setEditingPatrimony(null);
                      }}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <TabsContent value="dashboard" className="mt-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{dashboardData.totalEquipments}</div>
                <p className="text-sm text-gray-600">Total de Equipamentos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{formatCurrency(dashboardData.totalValue)}</div>
                <p className="text-sm text-gray-600">Valor Total do Patrimônio</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{dashboardData.equipmentsInUse}</div>
                <p className="text-sm text-gray-600">Equipamentos em Uso</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">{dashboardData.pendingReturns}</div>
                <p className="text-sm text-gray-600">Devoluções Atrasadas</p>
              </CardContent>
            </Card>
          </div>

          {/* Alertas */}
          {dashboardData.pendingReturns > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center text-red-900">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Equipamentos com Devolução Atrasada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-800">
                  Há {dashboardData.pendingReturns} equipamento(s) com devolução atrasada. 
                  Verifique a aba "Equipamentos" para mais detalhes.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="equipments" className="mt-6">
          {/* Filtros */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome ou série..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={contractFilter} onValueChange={setContractFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os contratos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Contratos</SelectItem>
                    {contracts.map(contract => (
                      <SelectItem key={contract.id} value={contract.id}>
                        {contract.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setContractFilter('all');
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
              <div className="mt-4 flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => openQrModal(filteredPatrimonies)}
                  disabled={contractFilter === 'all' || filteredPatrimonies.length === 0}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Imprimir QR Codes do Contrato
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Equipamentos */}
          <Card>
            <CardHeader>
                <CardTitle>Equipamentos Registrados ({filteredPatrimonies.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data Alocação</TableHead>
                    <TableHead>Devolução Prevista</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatrimonies.map((patrimony) => {
                    const contract = contracts.find(c => c.id === patrimony.contract_id);
                    const isOverdue = patrimony.status === 'em_uso' && 
                      patrimony.expected_return_date && 
                      new Date(patrimony.expected_return_date) < new Date();
                    
                    return (
                      <TableRow key={patrimony.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{patrimony.equipment_name}</div>
                            <div className="text-sm text-gray-500">Série: {patrimony.serial_number}</div>
                          </div>
                        </TableCell>
                        <TableCell>{contract?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {equipmentTypes[patrimony.equipment_type] || patrimony.equipment_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={statusColors[patrimony.status]}>
                              {statusLabels[patrimony.status]}
                            </Badge>
                            {isOverdue && (
                              <AlertTriangle className="w-4 h-4 text-red-500" title="Devolução atrasada" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(patrimony.equipment_value)}
                        </TableCell>
                        <TableCell>
                          {patrimony.allocation_date ? 
                            format(new Date(patrimony.allocation_date), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                        <TableCell className={isOverdue ? 'text-red-600 font-medium' : ''}>
                          {patrimony.expected_return_date ? 
                            format(new Date(patrimony.expected_return_date), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => {
                                setViewingPatrimony(patrimony);
                                setIsViewOpen(true);
                              }}>
                                <Eye className="w-4 h-4 mr-2" /> Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleFormOpen(patrimony)}>
                                <Edit className="w-4 h-4 mr-2" /> Editar
                              </DropdownMenuItem>
                               <DropdownMenuItem 
                                onClick={() => openQrModal(patrimony)} 
                                disabled={!patrimony.serial_number}
                              >
                                <QrCode className="w-4 h-4 mr-2" /> Gerar QR Code
                              </DropdownMenuItem>
                              {patrimony.status === 'em_uso' && (
                                <DropdownMenuItem onClick={() => handleStatusChange(patrimony.id, 'devolvido')}>
                                  <Truck className="w-4 h-4 mr-2" /> Marcar como Devolvido
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleDelete(patrimony.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {filteredPatrimonies.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum equipamento encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="w-5 h-5 mr-2" />
                Histórico de Movimentações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Tipo de Movimentação</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.slice(0, 50).map((movement) => {
                    const patrimony = patrimonies.find(p => p.id === movement.patrimony_id);
                    return (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {format(new Date(movement.movement_date), 'dd/MM/yyyy', { locale: pt })}
                        </TableCell>
                        <TableCell>{patrimony?.equipment_name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {movement.movement_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{movement.responsible_user}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {movement.observations}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <PatrimonyReport 
            patrimonies={patrimonies}
            contracts={contracts}
            movements={movements}
            user={user}
          />
        </TabsContent>
      </Tabs>

      {/* Modal de Visualização */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Equipamento</DialogTitle>
          </DialogHeader>
          {viewingPatrimony && (
            <PatrimonyView 
              patrimony={viewingPatrimony}
              contract={contracts.find(c => c.id === viewingPatrimony.contract_id)}
              movements={movements.filter(m => m.patrimony_id === viewingPatrimony.id)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Geração de QR Code */}
      {isQrModalOpen && (
        <QrCodeGenerator 
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          patrimonies={selectedPatrimonyForQr}
          user={user}
          onConfirm={() => {
            const items = Array.isArray(selectedPatrimonyForQr) ? selectedPatrimonyForQr : [selectedPatrimonyForQr];
            items.forEach(p => handleGenerateQr(p));
          }}
        />
      )}
    </div>
  );
}
