
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label'; // Assuming Label is available, often from Shadcn UI or Radix
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter // Adicionado DialogTrigger
} from '@/components/ui/dialog';
import {
  Plus, Search, FileText, Clock, BarChart3,
  FolderOpen, Eye, Edit, Download, Trash2, Link as LinkIcon, AlertTriangle, CheckCircle, XCircle, Filter
} from 'lucide-react';
import { Measurement } from '@/api/entities';
import { Contract } from '@/api/entities';
import { Employee } from '@/api/entities'; // New import from outline
import { User } from '@/api/entities';
import MeasurementForm from '../components/measurements/MeasurementForm';

// Checklist padrão para auditoria
const contractChecklists = {
  limpeza: ['CERTIDÕES', 'E-SOCIAL', 'FGTS', 'FOLHA DE PAGAMENTO', 'NOTA FISCAL'],
  seguranca: ['CERTIDÕES', 'E-SOCIAL', 'FGTS', 'FOLHA DE PAGAMENTO', 'NOTA FISCAL', 'RECICLAGEM'],
  manutencao: ['CERTIDÕES', 'E-SOCIAL', 'FGTS', 'FOLHA DE PAGAMENTO', 'NOTA FISCAL'],
  portaria: ['CERTIDÕES', 'E-SOCIAL', 'FGTS', 'FOLHA DE PAGAMENTO', 'NOTA FISCAL'],
  jardinagem: ['CERTIDÕES', 'E-SOCIAL', 'FGTS', 'FOLHA DE PAGAMENTO', 'NOTA FISCAL'],
  outros: ['CERTIDÕES', 'E-SOCIAL', 'FGTS', 'FOLHA DE PAGAMENTO', 'NOTA FISCAL'],
  default: ['CERTIDÕES', 'E-SOCIAL', 'FGTS', 'FOLHA DE PAGAMENTO', 'NOTA FISCAL'],
};

export default function MeasurementsPage() {
  const [user, setUser] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [contracts, setContracts] = useState([]);
  // Adding employees state as per outline for MeasurementViewModal, though it's not explicitly used in the provided JSX for the modal.
  const [employees, setEmployees] = useState([]); // Placeholder state, would be fetched in a real application.
  const [kpis, setKpis] = useState({
    activeContracts: 0,
    totalDocuments: 0,
    pendingMeasurements: 0,
    monthlyMeasurements: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMeasurement, setSelectedMeasurement] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [contractFilter, setContractFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [auditPendencies, setAuditPendencies] = useState([]);
  const [rejectionModal, setRejectionModal] = useState({ isOpen: false, measurementId: null, reason: '' });

  // New state variables for viewing measurement
  const [viewingMeasurement, setViewingMeasurement] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const runAudit = (measurementsData, contractsData) => {
    const pendencies = [];
    measurementsData.forEach(m => {
      const contract = contractsData.find(c => c.id === m.contract_id);
      if (!contract) return;

      const checklist = contractChecklists[contract.service_type] || contractChecklists.default;
      const requiredDocsCount = checklist.length;
      const sentDocsCount = m.documents_count || 0;

      // Rule 1: Missing required documents
      if (sentDocsCount < requiredDocsCount) {
        pendencies.push({
          measurement: m,
          contract,
          type: 'Documentos Ausentes',
          severity: 'critico'
        });
      }

      // Rule 2: Approved measurement with less than 100% execution
      if (m.execution_percentage < 100 && m.status === 'Aprovada') {
         pendencies.push({
          measurement: m,
          contract,
          type: 'Aprovada com execução < 100%',
          severity: 'alerta'
        });
      }
    });
    setAuditPendencies(pendencies);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const [measurementsData, contractsData] = await Promise.all([
        Measurement.filter({ cnpj: currentUser.cnpj }, "-created_date"),
        Contract.filter({ cnpj: currentUser.cnpj, status: 'ativo' })
      ]);

      setMeasurements(measurementsData);
      setContracts(contractsData);
      // In a real application, you would fetch employees here if they are needed by the MeasurementViewModal
      // For now, it remains an empty array as per initial state.

      runAudit(measurementsData, contractsData);

      // Calcular KPIs
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const contractsWithMeasurements = [...new Set(measurementsData.map(m => m.contract_id))].length;
      const totalDocuments = measurementsData.reduce((sum, m) => sum + (m.documents_count || 0), 0);
      const pendingMeasurements = measurementsData.filter(m => m.status === 'Em execução').length;
      const monthlyMeasurements = measurementsData.filter(m => m.measurement_month === currentMonth).length;

      setKpis({
        activeContracts: contractsWithMeasurements,
        totalDocuments,
        pendingMeasurements,
        monthlyMeasurements
      });

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
    setIsLoading(false);
  };

  const handleSuccess = () => {
    setIsFormOpen(false);
    setSelectedMeasurement(null);
    loadData();
  };

  const handleEdit = (measurement) => {
    setSelectedMeasurement(measurement);
    setIsFormOpen(true);
  };

  const handleDelete = async (measurementId) => {
    if (window.confirm("Tem certeza que deseja excluir esta medição?")) {
      try {
        await Measurement.delete(measurementId);
        loadData();
      } catch (error) {
        console.error("Erro ao excluir medição:", error);
        alert("Erro ao excluir medição.");
      }
    }
  };

  const handleApprove = async (measurementId) => {
    if (!user) {
      alert("Usuário não logado para realizar esta ação.");
      return;
    }
    try {
      await Measurement.update(measurementId, {
        approval_status: 'aprovado',
        approved_by: user.email,
        approval_date: new Date().toISOString()
      });
      loadData();
    } catch (error) {
      console.error("Erro ao aprovar:", error);
      alert("Erro ao aprovar medição.");
    }
  };

  const handleReject = async () => {
    if (!rejectionModal.reason) {
      alert("Por favor, informe o motivo da rejeição.");
      return;
    }
    if (!user) {
      alert("Usuário não logado para realizar esta ação.");
      return;
    }
    try {
      await Measurement.update(rejectionModal.measurementId, {
        approval_status: 'rejeitado',
        approved_by: user.email,
        approval_date: new Date().toISOString(),
        rejection_reason: rejectionModal.reason
      });
      setRejectionModal({ isOpen: false, measurementId: null, reason: '' });
      loadData();
    } catch (error) {
      console.error("Erro ao rejeitar:", error);
      alert("Erro ao rejeitar medição.");
    }
  };

  // New functions as per outline
  const handleViewMeasurement = (measurement) => {
    setViewingMeasurement(measurement);
    setIsViewModalOpen(true);
  };

  const generateMeasurementPDF = async (measurement) => {
    try {
      const contract = contracts.find(c => c.id === measurement.contract_id);
      // The outline included a lookup for 'employee' but did not use it in the modal's JSX provided.
      // const employee = employees.find(e => e.id === measurement.employee_id);

      // Here you would implement the actual PDF generation logic.
      // For now, we simulate it with an alert.
      alert(`Gerando PDF da medição de ${measurement.measurement_month} para o contrato ${contract?.name}`);

      // A real implementation would involve:
      // const pdfBlob = await generatePDF(measurement, contract, user);
      // downloadPDF(pdfBlob, `Medicao_${contract?.name}_${measurement.measurement_month}.pdf`);

    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF da medição.");
    }
  };

  // Agrupar medições por contrato
  const measurementsByContract = contracts.map(contract => {
    const contractMeasurements = measurements.filter(m => m.contract_id === contract.id);
    return {
      contract,
      measurements: contractMeasurements,
      documentsCount: contractMeasurements.reduce((sum, m) => sum + (m.documents_count || 0), 0)
    };
  });

  // Filtrar contratos baseado nos filtros aplicados
  const filteredContracts = measurementsByContract.filter(item => {
    const matchesContract = contractFilter === 'all' || item.contract.id === contractFilter;
    const matchesCategory = categoryFilter === 'all' || item.contract.service_type === categoryFilter;
    const matchesSearch = !searchTerm ||
      item.contract.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.measurements.some(m =>
        m.measurement_month.includes(searchTerm) ||
        m.status.toLowerCase().includes(searchTerm.toLowerCase())
      );

    return matchesContract && matchesCategory && matchesSearch;
  });

  const getStatusColor = (status) => {
    const colors = {
      'Em execução': 'bg-yellow-100 text-yellow-800',
      'Concluída': 'bg-blue-100 text-blue-800',
      'Aprovada': 'bg-green-100 text-green-800',
      'Rejeitada': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getApprovalStatusBadge = (measurement) => {
    const statusMap = {
      pendente: { text: "Pendente", className: "bg-yellow-100 text-yellow-800" },
      aprovado: { text: "Aprovado", className: "bg-green-100 text-green-800" },
      rejeitado: { text: "Rejeitado", className: "bg-red-100 text-red-800" }
    };
    const { text, className } = statusMap[measurement.approval_status || 'pendente'];
    return <Badge className={className}>{text}</Badge>;
  };

  const getAuditStatusBadge = (measurement) => {
     if (auditPendencies.some(p => p.measurement.id === measurement.id && p.severity === 'critico')) {
      return <Badge className="bg-red-100 text-red-800">Auditoria Crítica</Badge>;
    }
    if (auditPendencies.some(p => p.measurement.id === measurement.id && p.severity === 'alerta')) {
      return <Badge className="bg-yellow-100 text-yellow-800">Auditoria Alerta</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Auditoria OK</Badge>;
  };

  // MeasurementViewModal component as per outline
  const MeasurementViewModal = ({ measurement, contracts, employees, isOpen, onClose }) => {
    if (!measurement) return null;

    const contract = contracts.find(c => c.id === measurement.contract_id);
    // const employee = employees.find(e => e.id === measurement.employee_id); // As per outline, this line exists but 'employee' is not used in JSX.

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ficha de Medição - {measurement.measurement_month}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Identificação */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-3">📋 Identificação</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Contrato</Label>
                  <p className="text-sm text-gray-700">{contract?.name || 'Contrato não encontrado'}</p>
                </div>
                <div>
                  <Label>Cliente</Label>
                  <p className="text-sm text-gray-700">{contract?.client_name}</p>
                </div>
                <div>
                  <Label>Mês/Ano</Label>
                  <p className="text-sm text-gray-700">{measurement.measurement_month}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(measurement.status)}>
                    {measurement.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Execução */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-3">📊 Execução</h3>
              <div className="space-y-4">
                <div>
                  <Label>Percentual de Execução</Label>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-blue-600 h-4 rounded-full"
                        style={{ width: `${measurement.execution_percentage || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">
                      {Math.round(measurement.execution_percentage || 0)}%
                    </span>
                  </div>
                </div>
                <div>
                  <Label>Documentos Anexados</Label>
                  <p className="text-sm text-gray-700">{measurement.documents_count || 0} arquivos/links</p>
                </div>
                {measurement.due_date && (
                  <div>
                    <Label>Data de Vencimento</Label>
                    <p className="text-sm text-gray-700">{new Date(measurement.due_date).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Aprovação */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-3">✅ Status de Aprovação</h3>
              <div className="space-y-2">
                {getApprovalStatusBadge(measurement)}
                {measurement.approved_by && (
                  <p className="text-sm text-gray-600">
                    {measurement.approval_status === 'aprovado' ? 'Aprovado' : 'Rejeitado'} por {measurement.approved_by}
                    {measurement.approval_date && ` em ${new Date(measurement.approval_date).toLocaleDateString()}`}
                  </p>
                )}
                {measurement.rejection_reason && (
                  <div className="bg-red-100 p-3 rounded border-l-4 border-red-400">
                    <p className="text-sm text-red-800">
                      <strong>Motivo da rejeição:</strong> {measurement.rejection_reason}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Auditoria */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-3">🔍 Auditoria</h3>
              {getAuditStatusBadge(measurement)}
              {measurement.audit_notes && (
                <p className="text-sm text-gray-700 mt-2">{measurement.audit_notes}</p>
              )}
            </div>

            {measurement.observations && (
              <div>
                <Label>Observações</Label>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{measurement.observations}</p>
              </div>
            )}

            {/* Informações do Sistema */}
            <div className="bg-gray-50 p-4 rounded-lg text-xs text-gray-500">
              <p>Criado por: {measurement.created_by}</p>
              <p>Data de criação: {new Date(measurement.created_date).toLocaleString()}</p>
              {measurement.updated_date && (
                <p>Última atualização: {new Date(measurement.updated_date).toLocaleString()}</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medições</h1>
          <p className="text-gray-600">Acompanhe as medições mensais dos seus contratos</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-5 h-5 mr-2" />
              Nova Medição
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedMeasurement ? 'Editar Medição' : 'Cadastrar Nova Medição'}
              </DialogTitle>
            </DialogHeader>
            <MeasurementForm
              user={user}
              contracts={contracts}
              measurement={selectedMeasurement}
              onSuccess={handleSuccess}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs - Barra de Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Contratos</p>
                <p className="text-3xl font-bold">{kpis.activeContracts}</p>
                <p className="text-blue-100 text-xs">com medições</p>
              </div>
              <FileText className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Documentos</p>
                <p className="text-3xl font-bold">{kpis.totalDocuments}</p>
                <p className="text-green-100 text-xs">links cadastrados</p>
              </div>
              <LinkIcon className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Pendentes</p>
                <p className="text-3xl font-bold">{kpis.pendingMeasurements}</p>
                <p className="text-yellow-100 text-xs">em análise</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Mês Atual</p>
                <p className="text-3xl font-bold">{kpis.monthlyMeasurements}</p>
                <p className="text-purple-100 text-xs">medições</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Painel de Pendências de Auditoria */}
      {auditPendencies.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-900">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Pendências de Auditoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {auditPendencies.map((p, index) => (
                <div key={`${p.measurement.id}-${p.type}-${index}`} className={`p-3 rounded-md flex justify-between items-center ${p.severity === 'critico' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                   <div>
                     <p className="font-semibold text-sm">{p.contract.name} - {p.measurement.measurement_month}</p>
                     <p className="text-xs text-gray-700">{p.type}</p>
                   </div>
                   <Badge className={p.severity === 'critico' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'}>{p.severity}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros Avançados */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Select value={contractFilter} onValueChange={setContractFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os Contratos" />
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
            </div>

            <div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as Categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  <SelectItem value="limpeza">Limpeza</SelectItem>
                  <SelectItem value="seguranca">Segurança</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="portaria">Portaria</SelectItem>
                  <SelectItem value="jardinagem">Jardinagem</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Buscar documentos, contratos ou medições..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Listagem de Contratos Agrupados */}
      <div className="space-y-6">
        {filteredContracts.map(({ contract, measurements, documentsCount }) => (
          <Card key={contract.id} className="overflow-hidden">
            <CardHeader className="bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {contract.name}
                  </CardTitle>
                  <p className="text-gray-600 mt-1">
                    {contract.client_name} • {contract.id.substring(0, 8).toUpperCase()}
                  </p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <span>{measurements.length} medições cadastradas</span>
                    <span>{documentsCount} documentos vinculados</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        // The outline specified measurements[0] for PDF, assuming a contract-level report
                        // If no measurements exist for this contract, handle it gracefully.
                        if (measurements.length > 0) {
                            generateMeasurementPDF(measurements[0]);
                        } else {
                            alert("Nenhuma medição para gerar PDF para este contrato.");
                        }
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedMeasurement(null);
                      setIsFormOpen(true);
                    }}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Nova Medição
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {measurements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhuma medição cadastrada para este contrato</p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => {
                      setSelectedMeasurement(null);
                      setIsFormOpen(true);
                    }}
                  >
                    Cadastrar primeira medição
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {measurements.map(measurement => (
                    <Card key={measurement.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {measurement.measurement_month}
                            </h4>
                            <div className="flex flex-wrap gap-1 mt-1">
                                <Badge className={getStatusColor(measurement.status)}>
                                  {measurement.status}
                                </Badge>
                                {getApprovalStatusBadge(measurement)}
                                {getAuditStatusBadge(measurement)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">
                              {Math.round(measurement.execution_percentage || 0)}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {measurement.documents_count || 0} arquivos
                            </div>
                          </div>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${measurement.execution_percentage || 0}%` }}
                          ></div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Visualizar"
                              onClick={() => handleViewMeasurement(measurement)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Editar"
                              onClick={() => handleEdit(measurement)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Baixar PDF"
                              onClick={() => generateMeasurementPDF(measurement)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Excluir"
                              onClick={() => handleDelete(measurement.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                          <div className="text-xs text-gray-500">
                            {measurement.created_by?.split('@')[0]}
                          </div>
                        </div>

                        {/* WORKFLOW DE APROVAÇÃO */}
                        {(user?.department === 'admin' || user?.department === 'gestor') && (measurement.approval_status === undefined || measurement.approval_status === 'pendente') && (
                          <div className="mt-4 pt-4 border-t flex gap-2">
                            <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleApprove(measurement.id)}>
                              <CheckCircle className="w-4 h-4 mr-2" /> Aprovar
                            </Button>
                            <Button size="sm" variant="destructive" className="flex-1" onClick={() => setRejectionModal({ isOpen: true, measurementId: measurement.id, reason: '' })}>
                              <XCircle className="w-4 h-4 mr-2" /> Rejeitar
                            </Button>
                          </div>
                        )}

                        {measurement.approval_status && (measurement.approval_status !== 'pendente' || (user?.department !== 'admin' && user?.department !== 'gestor')) && (
                            <div className="mt-2 pt-2 border-t text-xs text-gray-500">
                                {measurement.approval_status === 'aprovado' ? 'Aprovado por' : 'Rejeitado por'} {measurement.approved_by} em {measurement.approval_date ? new Date(measurement.approval_date).toLocaleDateString() : 'N/A'}.
                                {measurement.rejection_reason && <p className="text-red-600">Motivo: {measurement.rejection_reason}</p>}
                            </div>
                        )}

                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContracts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Nenhum contrato encontrado
            </h3>
            <p className="text-gray-500 mb-6">
              Não há contratos que correspondam aos filtros selecionados.
            </p>
            <Button
              onClick={() => {
                setContractFilter('all');
                setCategoryFilter('all');
                setSearchTerm('');
              }}
            >
              Limpar Filtros
            </Button>
          </CardContent>
        </Card>
      )}

       {/* Rejection Modal */}
      <Dialog open={rejectionModal.isOpen} onOpenChange={() => setRejectionModal({ isOpen: false, measurementId: null, reason: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Medição</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejectionReason" className="pb-2 block">Motivo da Rejeição (obrigatório)</Label>
            <Textarea
              id="rejectionReason"
              value={rejectionModal.reason}
              onChange={(e) => setRejectionModal(prev => ({...prev, reason: e.target.value}))}
              placeholder="Descreva o motivo para a rejeição..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectionModal({ isOpen: false, measurementId: null, reason: '' })}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject}>Confirmar Rejeição</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização de Medição */}
      <MeasurementViewModal
        measurement={viewingMeasurement}
        contracts={contracts}
        employees={employees} // Passed as per outline, even if not used in modal's JSX
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingMeasurement(null);
        }}
      />
    </div>
  );
}
