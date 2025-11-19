
import React, { useState, useEffect, useCallback } from "react";
import { Employee } from "@/api/entities";
import { Contract } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, DollarSign, TrendingUp, Calculator, Upload, Edit } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import EmployeeForm from "../components/employees/EmployeeForm";
import EmployeeList from "../components/employees/EmployeeList";
import EmployeeFilters from "../components/employees/EmployeeFilters";
import CSVImport from "../components/employees/CSVImport";
import BulkUpdateForm from "../components/employees/BulkUpdateForm";
import HRIndicators from "../components/employees/HRIndicators";
import { User } from "@/api/entities";
import { canPerformAction } from '@/components/permissions';

const planLimits = {
    essencial: { contracts: 10, users: 5 },
    avancado: { contracts: 20, users: 10 },
    pro: { contracts: Infinity, users: Infinity }
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    totalEmployees: 0,
    averageSalary: 0,
    totalPayroll: 0,
    totalCharges: 0
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilteringLoading, setIsFilteringLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Paginação
  const [empPage, setEmpPage] = useState(1);
  const [empPageSize, setEmpPageSize] = useState(10);

  // NOVO: Status global de visualização (Ativos, Demissão, Férias, Ferista, Todos)
  const [statusView, setStatusView] = useState('ativos'); // 'ativos' | 'demissao' | 'ferias' | 'ferista' | 'todos'
  const [lastFilters, setLastFilters] = useState({}); // guarda filtros avançados atuais

  const isFerista = useCallback((emp) => {
    if (emp?.is_ferista) return true; // novo campo explícito
    const src = `${emp.role || ''} ${emp.observations || ''}`.toLowerCase();
    return src.includes('ferista');
  }, []);

  const applyStatusView = useCallback((list) => {
    switch (statusView) {
      case 'ativos':
        return list.filter(emp => emp.status === 'ativo' && !emp.dismissal_date);
      case 'demissao':
        return list.filter(emp => emp.status === 'inativo' || (emp.dismissal_date && emp.status !== 'ferias'));
      case 'ferias':
        return list.filter(emp => emp.status === 'ferias');
      case 'ferista':
        return list.filter(emp => isFerista(emp));
      case 'todos':
      default:
        return list;
    }
  }, [statusView, isFerista]);

  const applyAllFilters = useCallback((baseEmployees, filters) => {
    let filtered = [...baseEmployees];

    // Aplicar filtros avançados
    if (filters?.name) {
      filtered = filtered.filter(emp =>
        emp.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }
    if (filters?.email) {
      filtered = filtered.filter(emp =>
        emp.email && emp.email.toLowerCase().includes(filters.email.toLowerCase())
      );
    }
    if (filters?.whatsapp) {
      filtered = filtered.filter(emp =>
        emp.whatsapp && emp.whatsapp.includes(filters.whatsapp)
      );
    }
    if (filters?.cpf) {
      filtered = filtered.filter(emp =>
        emp.cpf && emp.cpf.includes(filters.cpf.replace(/\D/g, ''))
      );
    }
    if (filters?.role) {
      filtered = filtered.filter(emp =>
        emp.role.toLowerCase().includes(filters.role.toLowerCase())
      );
    }
    if (filters?.contract_id) {
      filtered = filtered.filter(emp => emp.contract_id === filters.contract_id);
    }
    if (filters?.unidade) {
      filtered = filtered.filter(emp =>
        emp.unidade && emp.unidade.toLowerCase().includes(filters.unidade.toLowerCase())
      );
    }
    // status avançado (se vier do filtro avançado, mantém compatibilidade)
    if (filters?.status && ['ativo','inativo','ferias'].includes(filters.status)) {
      filtered = filtered.filter(emp => emp.status === filters.status);
    }
    if (filters?.admission_date_from) {
      filtered = filtered.filter(emp =>
        emp.admission_date && emp.admission_date >= filters.admission_date_from
      );
    }
    if (filters?.admission_date_to) {
      filtered = filtered.filter(emp =>
        emp.admission_date && emp.admission_date <= filters.admission_date_to
      );
    }
    if (filters?.dismissal_date_from) {
      filtered = filtered.filter(emp =>
        emp.dismissal_date && emp.dismissal_date >= filters.dismissal_date_from
      );
    }
    if (filters?.dismissal_date_to) {
      filtered = filtered.filter(emp =>
        emp.dismissal_date && emp.dismissal_date <= filters.dismissal_date_to
      );
    }
    if (filters?.uniform_shirt_size) {
      filtered = filtered.filter(emp => (emp.uniform_shirt_size || '').toLowerCase() === filters.uniform_shirt_size.toLowerCase());
    }
    if (filters?.uniform_pants_size) {
      filtered = filtered.filter(emp => (emp.uniform_pants_size || '').toLowerCase().includes(filters.uniform_pants_size.toLowerCase()));
    }
    if (filters?.uniform_boot_size) {
      const boot = Number(filters.uniform_boot_size) || null;
      if (boot !== null) filtered = filtered.filter(emp => Number(emp.uniform_boot_size || 0) === boot);
    }
    if (filters?.uniform_jacket_size) {
      filtered = filtered.filter(emp => (emp.uniform_jacket_size || '').toLowerCase() === filters.uniform_jacket_size.toLowerCase());
    }
    if (filters?.uniform_gloves_size) {
      filtered = filtered.filter(emp => (emp.uniform_gloves_size || '').toLowerCase() === filters.uniform_gloves_size.toLowerCase());
    }
    if (filters?.uniform_hat_size) {
      filtered = filtered.filter(emp => (emp.uniform_hat_size || '').toLowerCase() === filters.uniform_hat_size.toLowerCase());
    }
    if (filters?.missing_sizes) {
      filtered = filtered.filter(emp => {
        const req = [
          "uniform_shirt_size","uniform_pants_size","uniform_pants_modeling",
          "uniform_boot_size","uniform_jacket_size","uniform_gloves_size",
          "uniform_hat_size","uniform_notes"
        ];
        return req.some(k => {
          const v = emp[k];
          return v === undefined || v === null || (typeof v === "string" ? v.trim() === "" : v === 0);
        });
      });
    }

    // NOVO: aplica status global de visualização DEPOIS dos filtros avançados
    filtered = applyStatusView(filtered);

    // Ordenação por nome
    filtered.sort((a, b) => a.name.localeCompare(b.name));
    return filtered;
  }, [applyStatusView]);


  const calculateDashboard = (empList) => {
    const activeEmployees = empList.filter(emp => emp.status === 'ativo');
    const totalSalaries = activeEmployees.reduce((sum, emp) => sum + (emp.base_salary || 0), 0);
    const totalCosts = activeEmployees.reduce((sum, emp) => sum + (emp.total_cost || 0), 0);
    const totalCharges = totalCosts - totalSalaries;

    setDashboardData({
      totalEmployees: activeEmployees.length,
      averageSalary: activeEmployees.length > 0 ? totalSalaries / activeEmployees.length : 0,
      totalPayroll: totalSalaries,
      totalCharges: totalCharges
    });
  };

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      const [empData, contractData] = await Promise.all([
        Employee.filter({ cnpj: currentUser.cnpj }, "-created_date"),
        Contract.filter({ cnpj: currentUser.cnpj, status: 'ativo' })
      ]);
      setEmployees(empData);
      // Aplicar filtros iniciais (incluindo statusView padrão 'ativos')
      setFilteredEmployees(applyAllFilters(empData, lastFilters));
      setContracts(contractData);
      calculateDashboard(empData);
      setEmpPage(1); // Reset page on data load
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
    setIsLoading(false);
  }, [lastFilters, applyAllFilters]); // Dependencies: lastFilters to ensure initial filter application uses the latest state. applyAllFilters for stability.

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleFiltersChange = async (filters) => {
    setIsFilteringLoading(true);
    setEmpPage(1);
    try {
      // Simular um pequeno delay para melhor UX
      await new Promise(resolve => setTimeout(resolve, 300));
      setLastFilters(filters); // guardar filtros atuais
      const filtered = applyAllFilters(employees, filters);
      setFilteredEmployees(filtered);
    } catch (error) {
      console.error("Erro ao aplicar filtros:", error);
    } finally {
      setIsFilteringLoading(false);
    }
  };

  // Reaplicar filtros quando statusView mudar ou quando a lista base de employees mudar
  // Este useEffect garante que a lista filtrada seja atualizada quando `statusView` muda,
  // ou quando os `employees` são recarregados (por exemplo, após uma operação de CRUD).
  // Ele usa `lastFilters` para manter os filtros avançados aplicados.
  useEffect(() => {
    if (employees.length > 0 || Object.keys(lastFilters).length > 0) {
      setFilteredEmployees(applyAllFilters(employees, lastFilters));
    }
  }, [statusView, employees, lastFilters, applyAllFilters]);


  const handleSuccess = () => {
    setIsFormOpen(false);
    setIsImportOpen(false);
    setIsBulkUpdateOpen(false);
    setSelectedEmployee(null);
    loadInitialData(); // Recarregar todos os dados
  };

  const handleSave = async (formData) => {
    setIsSaving(true);
    try {
      
      const dataToSave = {
        ...formData,
        cnpj: user.cnpj,
        created_by: selectedEmployee ? undefined : user.email, // Only set on create
        updated_by: selectedEmployee ? user.email : undefined // Only set on update
      };

      console.log("🔄 Salvando funcionário:", dataToSave);

      let savedEmployee;
      if (selectedEmployee) {
        savedEmployee = await Employee.update(selectedEmployee.id, dataToSave);
        console.log("✅ Funcionário atualizado:", savedEmployee);
      } else {
        savedEmployee = await Employee.create(dataToSave);
        console.log("✅ Funcionário criado:", savedEmployee);
      }

      console.log("🔄 Recarregando lista de funcionários...");
      handleSuccess();
      
      const successMessage = selectedEmployee ? 'Funcionário atualizado com sucesso!' : 'Funcionário cadastrado com sucesso!';
      alert(successMessage);
      console.log("✅", successMessage);
      
    } catch (error) {
      console.error("❌ Erro ao salvar funcionário:", error);
      alert(`Erro ao salvar funcionário: ${error.message || 'Verifique os dados e tente novamente.'}`);
    }
    setIsSaving(false);
  };

  const handleEdit = (employee) => {
    console.log("✏️ Abrindo formulário de edição para:", employee.name);
    setSelectedEmployee(employee);
    setIsFormOpen(true);
  };

  const handleImportSuccess = () => {
    handleSuccess();
    alert('Funcionários importados com sucesso!');
  };

  const handleBulkUpdateSuccess = () => {
    handleSuccess();
    alert('Funcionários atualizados em massa com sucesso!');
  };

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const userRole = user?.department || 'operador';

  // Paginação derivada (aplicada sobre a lista filtrada)
  const totalEmployees = filteredEmployees.length;
  const empTotalPages = Math.max(1, Math.ceil(totalEmployees / empPageSize));
  const empStartIdx = (empPage - 1) * empPageSize;
  const displayedEmployees = filteredEmployees.slice(empStartIdx, empStartIdx + empPageSize);

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header e Botões de Ação */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Funcionários</h1>
          <p className="text-gray-600 mt-1">Gerencie sua equipe, salários e alocações.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* NOVO: seletor de status global */}
          <div className="w-full sm:w-60">
            <Select value={statusView} onValueChange={(v)=>{ setStatusView(v); setEmpPage(1); }}>
              <SelectTrigger><SelectValue placeholder="Exibir" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativos">Funcionários Ativos</SelectItem>
                <SelectItem value="demissao">Demissão</SelectItem>
                <SelectItem value="ferias">Férias</SelectItem>
                <SelectItem value="ferista">Ferista</SelectItem>
                <SelectItem value="todos">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {canPerformAction(userRole, 'create') && (
            <>
              <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                      <Upload className="w-4 h-4 mr-2" />
                      Importar CSV
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px]">
                  <DialogHeader>
                    <DialogTitle>Importar Funcionários em Massa</DialogTitle>
                  </DialogHeader>
                  <CSVImport
                    contracts={contracts}
                    user={user}
                    onSuccess={handleImportSuccess}
                    onCancel={() => setIsImportOpen(false)}
                  />
                </DialogContent>
              </Dialog>

              <Dialog open={isBulkUpdateOpen} onOpenChange={setIsBulkUpdateOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={() => setIsBulkUpdateOpen(true)}>
                      <Users className="w-4 h-4 mr-2" />
                      Atualizar Tamanhos em Massa
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Atualização em Massa de Funcionários</DialogTitle>
                  </DialogHeader>
                  <BulkUpdateForm
                    employees={filteredEmployees}
                    contracts={contracts}
                    onSuccess={handleBulkUpdateSuccess}
                    onCancel={() => setIsBulkUpdateOpen(false)}
                  />
                </DialogContent>
              </Dialog>

              <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setSelectedEmployee(null); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Funcionário
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{selectedEmployee ? "Editar Funcionário" : "Novo Funcionário"}</DialogTitle>
                  </DialogHeader>
                  <EmployeeForm
                    employee={selectedEmployee}
                    contracts={contracts}
                    onSave={handleSave}
                    onCancel={() => setIsFormOpen(false)}
                    isSaving={isSaving}
                  />
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Mini Dashboard RH */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Funcionários</p>
                <p className="text-3xl font-bold text-blue-600">
                  {dashboardData.totalEmployees}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Salário Médio</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(dashboardData.averageSalary)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Folha de Pagamento Total</p>
                <p className="text-3xl font-bold text-purple-600">
                  {formatCurrency(dashboardData.totalPayroll)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Encargos Totais</p>
                <p className="text-3xl font-bold text-orange-600">
                  {formatCurrency(dashboardData.totalCharges)}
                </p>
              </div>
              <Calculator className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indicadores de RH */}
      <HRIndicators
        employees={filteredEmployees}
        contracts={contracts}
        statusView={statusView}
      />

      {/* Filtros Avançados */}
      <EmployeeFilters 
        contracts={contracts}
        onFiltersChange={handleFiltersChange}
        totalResults={filteredEmployees.length}
        isLoading={isFilteringLoading}
      />

      {/* Lista de Funcionários */}
      <EmployeeList 
        employees={displayedEmployees}
        contracts={contracts}
        onEdit={handleEdit}
        onDataChange={loadInitialData}
        user={user}
        isLoading={isFilteringLoading}
      />

      {/* Paginação */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-sm text-gray-600">
          Exibindo {displayedEmployees.length} de {totalEmployees} funcionários
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Itens por página</span>
          <Select value={String(empPageSize)} onValueChange={(v)=>{ setEmpPageSize(Number(v)); setEmpPage(1); }}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" disabled={empPage===1} onClick={()=>setEmpPage(p=>Math.max(1,p-1))}>Anterior</Button>
          <div className="px-2 text-sm">{empPage} / {empTotalPages}</div>
          <Button variant="outline" disabled={empPage===empTotalPages} onClick={()=>setEmpPage(p=>Math.min(empTotalPages,p+1))}>Próxima</Button>
        </div>
      </div>
    </div>
  );
}
