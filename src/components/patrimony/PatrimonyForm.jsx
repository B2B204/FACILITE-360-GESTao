
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Save, Loader2, Package, Calendar, FileText } from 'lucide-react'; 

export default function PatrimonyForm({ isEditing, patrimony, contracts, employees, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    equipment_name: "",
    serial_number: "",
    equipment_type: "ferramenta",
    contract_id: "",
    allocation_date: "",
    expected_return_date: "",
    equipment_value: 0,
    status: "em_uso",
    observations: ""
  });
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkData, setBulkData] = useState({ quantity: 1, base_name: "", start_number: 1 });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (patrimony) {
      setFormData({
        equipment_name: patrimony.equipment_name || "",
        serial_number: patrimony.serial_number || "",
        equipment_type: patrimony.equipment_type || "ferramenta",
        contract_id: patrimony.contract_id || "",
        allocation_date: patrimony.allocation_date || "",
        expected_return_date: patrimony.expected_return_date || "",
        equipment_value: patrimony.equipment_value || 0,
        status: patrimony.status || "em_uso",
        observations: patrimony.observations || ""
      });
      setShowBulkForm(false); // Ensure bulk form is not shown when editing an existing patrimony
    } else {
      // Limpar formulário para novo cadastro
      setFormData({
        equipment_name: "",
        serial_number: "", // Reset serial number for new entry
        equipment_type: "ferramenta",
        contract_id: "",
        allocation_date: "",
        expected_return_date: "",
        equipment_value: 0,
        status: "em_uso",
        observations: ""
      });
      setShowBulkForm(false);
    }
  }, [patrimony]);

  const generateQRCodeUrl = (serialNumber) => {
    // Generate a URL that points to the patrimony details page
    // Assumes your application serves patrimony details at /patrimony/:serialNumber
    const baseUrl = window.location.origin;
    return `${baseUrl}/patrimony/${encodeURIComponent(serialNumber)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      if (showBulkForm && !isEditing) { // Bulk creation is only for new patrimony
        const equipmentsToSave = [];
        for (let i = 0; i < bulkData.quantity; i++) {
          const generatedSerialNumber = `${bulkData.base_name}-${String(bulkData.start_number + i).padStart(3, '0')}`;
          const patrimoniyUrl = generateQRCodeUrl(generatedSerialNumber);
          
          equipmentsToSave.push({
            ...formData,
            equipment_name: bulkData.base_name ? `${formData.equipment_name} ${i + 1}` : formData.equipment_name, // Adjust name if needed for bulk
            serial_number: generatedSerialNumber,
            patrimony_url: patrimoniyUrl,
            qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(patrimoniyUrl)}`
          });
        }
        await onSave(equipmentsToSave); 
      } else {
        // Single creation/edit
        let dataToSave = { ...formData };

        // Generate serial number for single new equipment if not editing
        if (!isEditing && !formData.serial_number) { // Only generate if not editing and serial_number is empty
            const timestamp = Date.now();
            const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
            dataToSave.serial_number = `EQP-${timestamp}-${randomSuffix}`;
        } else if (!isEditing && formData.serial_number) {
          // If serial_number is manually entered for a new single item, use it directly.
          // No change needed for dataToSave.serial_number as it already holds the manually entered value.
        }
        
        const patrimoniyUrl = generateQRCodeUrl(dataToSave.serial_number);
        dataToSave = {
          ...dataToSave,
          patrimony_url: patrimoniyUrl,
          qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(patrimoniyUrl)}`
        };
        await onSave(dataToSave); 
      }
    } catch (error) {
      console.error("Erro ao submeter formulário de patrimônio:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSelectChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6 py-4">
      {/* Opção de Cadastro em Lote */}
      {!isEditing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <input 
              type="checkbox" 
              id="bulk-checkbox"
              checked={showBulkForm} 
              onChange={(e) => setShowBulkForm(e.target.checked)} 
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Label htmlFor="bulk-checkbox" className="flex items-center space-x-2 cursor-pointer text-blue-800 font-medium">
              <Package className="w-4 h-4" />
              <span>Cadastrar múltiplos equipamentos (lote)</span>
            </Label>
          </div>
        </div>
      )}

      {/* Formulário de Cadastro em Lote */}
      {showBulkForm && !isEditing && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Package className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="font-semibold text-blue-900">📦 Configuração do Lote</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="quantity" className="text-blue-800">Quantidade *</Label>
              <Input 
                type="number" 
                id="quantity" 
                name="quantity"
                value={bulkData.quantity} 
                onChange={(e) => setBulkData(prev => ({...prev, quantity: parseInt(e.target.value) || 1}))}
                min="1" 
                max="50" 
                required
                className="border-blue-300 focus:border-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="base_name" className="text-blue-800">Prefixo do Serial *</Label>
              <Input 
                id="base_name" 
                name="base_name"
                value={bulkData.base_name} 
                onChange={(e) => setBulkData(prev => ({...prev, base_name: e.target.value}))}
                placeholder="Ex: EQP" 
                required
                className="border-blue-300 focus:border-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="start_number" className="text-blue-800">Número Inicial *</Label>
              <Input 
                type="number" 
                id="start_number" 
                name="start_number"
                value={bulkData.start_number} 
                onChange={(e) => setBulkData(prev => ({...prev, start_number: parseInt(e.target.value) || 1}))}
                min="1" 
                required
                className="border-blue-300 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="mt-3 p-3 bg-blue-100 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Exemplo de numeração:</strong> {bulkData.base_name || 'PREFIX'}-{String(bulkData.start_number).padStart(3, '0')} até {bulkData.base_name || 'PREFIX'}-{String(bulkData.start_number + bulkData.quantity - 1).padStart(3, '0')}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações do Equipamento */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Package className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="font-semibold text-green-900">🏷️ Informações do Equipamento</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="equipment_name" className="text-green-800">Nome do Equipamento *</Label>
              <Input 
                id="equipment_name" 
                name="equipment_name" 
                value={formData.equipment_name} 
                onChange={handleChange} 
                required 
                placeholder="Ex: Aspirador Industrial"
                className="border-green-300 focus:border-green-500"
              />
            </div>
            <div>
              <Label htmlFor="serial_number" className="text-green-800">Número de Série/Patrimônio</Label>
              <Input 
                id="serial_number" 
                name="serial_number" 
                value={formData.serial_number} 
                onChange={handleChange} 
                placeholder={isEditing ? "Ex: ASP-001" : showBulkForm ? "Gerado por lote" : "Gerado automaticamente ou digite um"}
                disabled={!isEditing && showBulkForm} // Disable if not editing AND in bulk form
                className={`${!isEditing && showBulkForm ? 'bg-gray-100 text-gray-500' : 'border-green-300 focus:border-green-500'}`}
              />
            </div>
            <div>
              <Label className="text-green-800">Tipo de Equipamento *</Label>
              <Select 
                value={formData.equipment_type} 
                onValueChange={(v) => handleSelectChange("equipment_type", v)}
              >
                <SelectTrigger className="border-green-300 focus:border-green-500">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ferramenta">🔧 Ferramenta</SelectItem>
                  <SelectItem value="maquinario">⚙️ Maquinário</SelectItem>
                  <SelectItem value="epi">🦺 EPI</SelectItem>
                  <SelectItem value="mobiliario">🪑 Mobiliário</SelectItem>
                  <SelectItem value="eletronico">💻 Eletrônico</SelectItem>
                  <SelectItem value="veiculo">🚗 Veículo</SelectItem>
                  <SelectItem value="outros">📦 Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="equipment_value" className="text-green-800">Valor do Equipamento (R$) *</Label>
              <Input 
                type="number" 
                step="0.01"
                id="equipment_value" 
                name="equipment_value" 
                value={formData.equipment_value} 
                onChange={handleChange} 
                required
                className="border-green-300 focus:border-green-500"
                placeholder="0,00"
              />
            </div>
          </div>
        </div>

        {/* Alocação e Retorno */}
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Calendar className="w-5 h-5 text-yellow-600 mr-2" />
            <h3 className="font-semibold text-yellow-900">📅 Alocação e Retorno</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-yellow-800">Contrato Vinculado *</Label>
              <Select 
                value={formData.contract_id} 
                onValueChange={(v) => handleSelectChange("contract_id", v)}
              >
                <SelectTrigger className="border-yellow-300 focus:border-yellow-500">
                  <SelectValue placeholder="Selecione o contrato" />
                </SelectTrigger>
                <SelectContent>
                  {contracts && contracts.length > 0 ? (
                    contracts.map(contract => (
                      <SelectItem key={contract.id} value={contract.id}>
                        {contract.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value={null} disabled>
                      Nenhum contrato ativo encontrado
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="allocation_date" className="text-yellow-800">Data de Alocação *</Label>
              <Input
                id="allocation_date"
                name="allocation_date"
                type="date"
                value={formData.allocation_date}
                onChange={handleChange}
                required
                className="border-yellow-300 focus:border-yellow-500"
              />
            </div>
            <div>
              <Label htmlFor="expected_return_date" className="text-yellow-800">Data Prevista Devolução</Label>
              <Input
                id="expected_return_date"
                name="expected_return_date"
                type="date"
                value={formData.expected_return_date}
                onChange={handleChange}
                className="border-yellow-300 focus:border-yellow-500"
              />
            </div>
            <div>
              <Label className="text-yellow-800">Status *</Label>
              <Select 
                value={formData.status} 
                onValueChange={(v) => handleSelectChange("status", v)}
              >
                <SelectTrigger className="border-yellow-300 focus:border-yellow-500">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="em_uso">✅ Em Uso</SelectItem>
                  <SelectItem value="devolvido">📦 Devolvido</SelectItem>
                  <SelectItem value="pendente">⏳ Pendente</SelectItem>
                  <SelectItem value="extraviado">❌ Extraviado</SelectItem>
                  <SelectItem value="manutencao">🔧 Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <FileText className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="font-semibold text-gray-900">📝 Observações</h3>
          </div>
          <div>
            <Label htmlFor="observations" className="text-gray-800">Observações Adicionais</Label>
            <Textarea
              id="observations"
              name="observations"
              value={formData.observations}
              onChange={handleChange}
              placeholder="Informações adicionais sobre o equipamento, condições, localização específica, etc."
              rows={4}
              className="border-gray-300 focus:border-gray-500"
            />
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 bg-white sticky bottom-0">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel} 
            disabled={isSaving}
            className="px-6 py-2"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing 
                  ? "Salvar Alterações" 
                  : showBulkForm 
                    ? `Cadastrar ${bulkData.quantity} Equipamento(s)` 
                    : "Cadastrar Equipamento"
                }
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
