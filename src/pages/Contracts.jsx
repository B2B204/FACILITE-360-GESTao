
import React, { useState, useEffect } from "react";
import { Contract } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from
"@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from
"@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from
"@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus, MoreVertical, Edit, Trash2, ExternalLink, Search
} from
"lucide-react";
import { format } from "date-fns";
import ContractForm from "../components/contracts/ContractForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from
"@/components/ui/dropdown-menu";
import { User } from "@/api/entities";
import { canPerformAction } from "@/components/permissions";

const planLimits = {
  essencial: { contracts: 10, users: 5 },
  avancado: { contracts: 20, users: 10 },
  pro: { contracts: Infinity, users: Infinity }
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      // Only fetch contracts that are not soft-deleted
      const data = await Contract.filter({ cnpj: currentUser.cnpj, deleted_at: null }, "-created_date");
      setContracts(data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
    setIsLoading(false);
  };

  const handleSave = async (formData) => {
    setIsSaving(true);
    setSaveMessage("");

    try {
      const currentPlan = user?.plan || 'none';

      const planLimit = planLimits[currentPlan]?.contracts;

      if (!selectedContract && planLimit !== Infinity && contracts.length >= planLimit) {
        alert(`Você atingiu o limite de ${planLimit} contratos do seu plano. Faça um upgrade para adicionar mais.`);
        setIsSaving(false);
        return;
      }

      // Dados completos para salvar incluindo CNPJ e auditoria
      const dataToSave = {
        ...formData,
        cnpj: user.cnpj,
        ...(selectedContract ? { updated_by: user.email } : { created_by: user.email })
      };

      let result;
      if (selectedContract) {
        result = await Contract.update(selectedContract.id, dataToSave);
        setSaveMessage("Contrato atualizado com sucesso!");
      } else {
        result = await Contract.create(dataToSave);
        setSaveMessage("Contrato cadastrado com sucesso!");
      }

      // Recarregar os dados
      await loadData();

      // Mostrar mensagem de sucesso
      setTimeout(() => {
        setIsFormOpen(false);
        setSelectedContract(null);
        setSaveMessage("");
      }, 2000);

    } catch (error) {
      console.error("Erro ao salvar contrato:", error);
      alert("Erro ao salvar contrato. Verifique se todos os campos obrigatórios foram preenchidos corretamente.");
    }
    setIsSaving(false);
  };

  const handleEdit = (contract) => {
    setSelectedContract(contract);
    setIsFormOpen(true);
  };

  const handleCreateNew = () => {
    const currentPlan = user?.plan || 'none';

    const planLimit = planLimits[currentPlan]?.contracts;

    if (planLimit !== Infinity && contracts.length >= planLimit) {
      alert(`Você atingiu o limite de ${planLimit} contratos do seu plano. Faça um upgrade para adicionar mais.`);
      return;
    }

    setSelectedContract(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este contrato?") && window.confirm("Confirma a exclusão? O contrato irá para a Lixeira e poderá ser restaurado.")) {
      try {
        // Soft delete com auditoria
        await Contract.update(id, {
          deleted_at: new Date().toISOString(),
          deleted_by: user.email,
          updated_by: user.email,
          status: 'inativo'
        });

        await loadData();
        alert("Contrato excluído (enviado para a Lixeira) com sucesso!");
      } catch (error) {
        console.error("Erro ao excluir contrato:", error);
        alert("Erro ao excluir contrato.");
      }
    }
  };

  const filteredContracts = contracts.filter((c) => {
    const matchesSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contract_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesService = serviceFilter === "all" || c.service_type === serviceFilter;

    return matchesSearch && matchesStatus && matchesService;
  });

  // Paginação derivada
  const totalContracts = filteredContracts.length;
  const totalPages = Math.max(1, Math.ceil(totalContracts / pageSize));
  const startIdx = (currentPage - 1) * pageSize;
  const pageContracts = filteredContracts.slice(startIdx, startIdx + pageSize);

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const statusColors = {
    ativo: "bg-green-100 text-green-800",
    inativo: "bg-red-100 text-red-800",
    suspenso: "bg-yellow-100 text-yellow-800"
  };

  const serviceTypes = {
    limpeza: "Limpeza",
    portaria: "Portaria",
    manutencao: "Manutenção",
    seguranca: "Segurança",
    jardinagem: "Jardinagem",
    ar_condicionado: "Ar-condicionado",
    obras: "Obras",
    copeiragem: "Copeiragem",
    garcom: "Garçom",
    administrativo: "Administrativo",
    outros: "Outros"
  };

  const userRole = user?.department || 'operador';

  return (
    <div className="py-5 space-y-6">
      {/* Filtros e Ações */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Buscar Contratos</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Nome, cliente ou número do contrato..."
                value={searchTerm}
                onChange={(e) => {setSearchTerm(e.target.value);setCurrentPage(1);}}
                className="pl-10" />

            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={statusFilter} onValueChange={(v) => {setStatusFilter(v);setCurrentPage(1);}}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="suspenso">Suspenso</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Tipo de Serviço</label>
            <Select value={serviceFilter} onValueChange={(v) => {setServiceFilter(v);setCurrentPage(1);}}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(serviceTypes).map(([key, label]) =>
                <SelectItem key={key} value={key}>{label}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          {canPerformAction(userRole, 'create') &&
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Contrato
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{selectedContract ? "Editar Contrato" : "Novo Contrato"}</DialogTitle>
                </DialogHeader>
                <ContractForm
                contract={selectedContract}
                onSave={handleSave}
                onCancel={() => {
                  setIsFormOpen(false);
                  setSelectedContract(null);
                }}
                isSaving={isSaving} />

              </DialogContent>
            </Dialog>
          }
        </div>
      </div>

      {/* Mensagem de Sucesso */}
      {saveMessage &&
      <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-center">
          {saveMessage}
        </div>
      }

      {/* Tabela de Contratos */}
      <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="min-w-[200px]">Número & Cliente</TableHead>
              <TableHead className="min-w-[180px]">Nome do Contrato</TableHead>
              <TableHead className="min-w-[140px]">Tipo de Serviço</TableHead>
              <TableHead className="min-w-[110px]">Status</TableHead>
              <TableHead className="min-w-[140px]">Valor Mensal</TableHead>
              <TableHead className="min-w-[140px]">Valor Anual</TableHead>
              <TableHead className="min-w-[110px]">Funcionários</TableHead>
              <TableHead className="min-w-[130px]">Data Início</TableHead>
              <TableHead className="min-w-[90px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ?
            <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  Carregando contratos...
                </TableCell>
              </TableRow> :
            pageContracts.length === 0 ?
            <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  Nenhum contrato encontrado
                </TableCell>
              </TableRow> :

            pageContracts.map((contract) =>
            <TableRow key={contract.id} className="hover:bg-gray-50">
                  <TableCell className="py-3 align-middle [&:has([role=checkbox])]:pr-0 min-w-[160px] md:min-w-[200px]">
                    <div>
                      <div className="bg-blue-50 text-gray-600 mb-1 px-2 py-1 text-sm font-mono rounded whitespace-nowrap">
                        📌 {contract.contract_number || "N/A"}
                      </div>
                      <div className="text-sm text-gray-500 whitespace-normal break-words max-w-[200px] sm:max-w-[260px] md:max-w-none">
                        {contract.client_name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="align-middle [&:has([role=checkbox])]:pr-0 min-w-[180px]">
                    <div className="font-medium text-gray-900 whitespace-normal break-words max-w-[240px] md:max-w-none">
                      {contract.name}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 align-middle [&:has([role=checkbox])]:pr-0 min-w-[140px]">
                    <Badge variant="secondary" className="capitalize whitespace-nowrap">{serviceTypes[contract.service_type] || contract.service_type}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-4 align-middle [&:has([role=checkbox])]:pr-0 min-w-[110px]">
                    <Badge className={`${statusColors[contract.status]} capitalize whitespace-nowrap`}>{contract.status}</Badge>
                  </TableCell>
                  <TableCell className="px-2 py-4 font-medium align-middle [&:has([role=checkbox])]:pr-0 min-w-[140px] whitespace-nowrap kpi-value">
                    {formatCurrency(contract.monthly_value)}
                  </TableCell>
                  <TableCell className="text-green-600 py-4 font-medium align-middle [&:has([role=checkbox])]:pr-0 min-w-[140px] whitespace-nowrap kpi-value">
                    {formatCurrency(contract.annual_value)}
                  </TableCell>
                  <TableCell className="px-8 py-4 align-middle [&:has([role=checkbox])]:pr-0 min-w-[110px] whitespace-nowrap">{contract.number_of_employees || 0}</TableCell>
                  <TableCell className="min-w-[130px] whitespace-nowrap">
                    {contract.start_date ? format(new Date(contract.start_date), "dd/MM/yyyy") : "-"}
                  </TableCell>
                  <TableCell className="text-right px-5 py-4 align-middle [&:has([role=checkbox])]:pr-0 min-w-[90px]">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {canPerformAction(userRole, 'edit') &&
                    <DropdownMenuItem onClick={() => handleEdit(contract)}>
                            <Edit className="w-4 h-4 mr-2" /> Editar
                          </DropdownMenuItem>
                    }
                        {contract.useful_link &&
                    <DropdownMenuItem asChild>
                            <a href={contract.useful_link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-2" /> Abrir Link
                            </a>
                          </DropdownMenuItem>
                    }
                        {canPerformAction(userRole, 'delete') &&
                    <DropdownMenuItem
                      onClick={() => handleDelete(contract.id)}
                      className="text-red-600">

                            <Trash2 className="w-4 h-4 mr-2" /> Excluir
                          </DropdownMenuItem>
                    }
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
            )
            }
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-sm text-gray-600">
          Exibindo {pageContracts.length} de {totalContracts} contratos
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Itens por página</span>
          <Select value={String(pageSize)} onValueChange={(v) => {setPageSize(Number(v));setCurrentPage(1);}}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>Anterior</Button>
          <div className="px-2 text-sm">{currentPage} / {totalPages}</div>
          <Button variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>Próxima</Button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{contracts.length}</div>
          <div className="text-sm text-blue-800">Total de Contratos</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {contracts.filter((c) => c.status === 'ativo').length}
          </div>
          <div className="text-sm text-green-800">Contratos Ativos</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(contracts.reduce((sum, c) => sum + (c.monthly_value || 0), 0))}
          </div>
          <div className="text-sm text-purple-800">Receita Mensal Total</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(contracts.reduce((sum, c) => sum + (c.annual_value || 0), 0))}
          </div>
          <div className="text-sm text-orange-800">Receita Anual Total</div>
        </div>
      </div>
    </div>);

}
