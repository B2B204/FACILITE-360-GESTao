
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UploadFile } from "@/api/integrations";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Camera, Save } from "lucide-react";

export default function EmployeeForm({ employee, contracts, onSave, onCancel, isSaving }) {
  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    role: "",
    unidade: "",
    photo_url: "",
    contract_id: "",
    admission_date: "",
    dismissal_date: "", // New field
    work_shift: "comercial",
    base_salary: 0,
    meal_allowance: 0,
    transport_allowance: 0,
    health_plan: 0,
    other_benefits: 0,
    social_charges_percentage: 40,
    total_salary: 0,
    benefits_cost: 0,
    social_charges_cost: 0,
    total_cost: 0,
    status: "ativo",
    observations: "",
    // New fields
    email: "",
    whatsapp: "",
    pix_key: "",
    useful_link: "",
    // Ferista (novo)
    is_ferista: false,
    // Uniforms (required)
    uniform_shirt_size: "",
    uniform_pants_size: "",
    uniform_pants_modeling: "masc",
    uniform_boot_size: 0,
    uniform_boot_steel_toe: false,
    uniform_jacket_size: "",
    uniform_gloves_size: "",
    uniform_hat_size: "",
    uniform_notes: ""
  });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData({
        ...employee,
        admission_date: employee.admission_date ? employee.admission_date.split('T')[0] : '',
        dismissal_date: employee.dismissal_date ? employee.dismissal_date.split('T')[0] : '', // Load dismissal date
        name: employee.name || "",
        cpf: employee.cpf || "",
        role: employee.role || "",
        unidade: employee.unidade || "",
        photo_url: employee.photo_url || "",
        contract_id: employee.contract_id || "",
        // Ensure numeric fields default to 0 if null/undefined in employee object
        base_salary: employee.base_salary || 0,
        meal_allowance: employee.meal_allowance || 0,
        transport_allowance: employee.transport_allowance || 0,
        health_plan: employee.health_plan || 0,
        other_benefits: employee.other_benefits || 0,
        social_charges_percentage: employee.social_charges_percentage || 40,
        total_salary: employee.total_salary || 0,
        benefits_cost: employee.benefits_cost || 0,
        social_charges_cost: employee.social_charges_cost || 0,
        total_cost: employee.total_cost || 0,
        status: employee.status || "ativo",
        observations: employee.observations || "",
        // New fields initialization
        email: employee.email || "",
        whatsapp: employee.whatsapp || "",
        pix_key: employee.pix_key || "",
        useful_link: employee.useful_link || "",
        // Ferista
        is_ferista: !!employee.is_ferista,
        // Uniforms
        uniform_shirt_size: employee.uniform_shirt_size || "",
        uniform_pants_size: employee.uniform_pants_size || "",
        uniform_pants_modeling: employee.uniform_pants_modeling || "masc",
        uniform_boot_size: employee.uniform_boot_size || 0,
        uniform_boot_steel_toe: !!employee.uniform_boot_steel_toe, // Ensure boolean
        uniform_jacket_size: employee.uniform_jacket_size || "",
        uniform_gloves_size: employee.uniform_gloves_size || "",
        uniform_hat_size: employee.uniform_hat_size || "",
        uniform_notes: employee.uniform_notes || ""
      });
    } else {
      // Reset form data for new employee creation
      setFormData({
        name: "",
        cpf: "",
        role: "",
        unidade: "",
        photo_url: "",
        contract_id: "",
        admission_date: "",
        dismissal_date: "", // Default for new employee
        work_shift: "comercial",
        base_salary: 0,
        meal_allowance: 0,
        transport_allowance: 0,
        health_plan: 0,
        other_benefits: 0,
        social_charges_percentage: 40,
        total_salary: 0,
        benefits_cost: 0,
        social_charges_cost: 0,
        total_cost: 0,
        status: "ativo",
        observations: "",
        email: "",
        whatsapp: "",
        pix_key: "",
        useful_link: "",
        // Ferista (novo)
        is_ferista: false,
        // Uniforms default
        uniform_shirt_size: "",
        uniform_pants_size: "",
        uniform_pants_modeling: "masc",
        uniform_boot_size: 0,
        uniform_boot_steel_toe: false,
        uniform_jacket_size: "",
        uniform_gloves_size: "",
        uniform_hat_size: "",
        uniform_notes: ""
      });
    }
  }, [employee]);

  // Automatic calculations
  useEffect(() => {
    const baseSalary = formData.base_salary;
    const mealAllowance = formData.meal_allowance;
    const transportAllowance = formData.transport_allowance;
    const healthPlan = formData.health_plan;
    const otherBenefits = formData.other_benefits;
    const chargesPercentage = formData.social_charges_percentage;

    const totalSalary = baseSalary + mealAllowance + transportAllowance;
    const benefitsCost = healthPlan + otherBenefits;
    const socialChargesCost = (baseSalary * chargesPercentage) / 100;
    const totalCost = totalSalary + benefitsCost + socialChargesCost;

    setFormData(prev => ({
      ...prev,
      total_salary: totalSalary,
      benefits_cost: benefitsCost,
      social_charges_cost: socialChargesCost,
      total_cost: totalCost,
    }));
  }, [formData.base_salary, formData.meal_allowance, formData.transport_allowance, formData.health_plan, formData.other_benefits, formData.social_charges_percentage]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setFormData(prev => ({ ...prev, photo_url: file_url }));
    } catch (error) {
      console.error("Erro ao fazer upload da foto:", error);
      alert("Erro ao fazer upload da foto");
    }
    setIsUploading(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Date validation
    if (type === 'date' && value) {
        const year = value.split('-')[0];
        if (year.length > 4) {
            alert("Ano inválido. Digite um ano com 4 dígitos, como 2025.");
            return;
        }
    }

    // Determine the correct value type (number or string)
    let processedValue = value;
    if (name === "uniform_boot_steel_toe" || name === "is_ferista") {
      processedValue = checked;
    } else if (name.includes('salary') || name.includes('allowance') || name.includes('plan') || name.includes('benefits') || name.includes('percentage') || name === 'uniform_boot_size') {
        processedValue = Number(value) || 0; // Convert to number, default to 0 if NaN
    }

    // Update the form data
    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isUniformsIncomplete = () => {
    const req = [
      "uniform_shirt_size","uniform_pants_size","uniform_pants_modeling",
      "uniform_boot_size","uniform_jacket_size","uniform_gloves_size",
      "uniform_hat_size","uniform_notes"
    ];
    return req.some(k => {
      const v = formData[k];
      return v === undefined || v === null || (typeof v === "string" ? v.trim() === "" : v === 0);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validações
    if (!formData.name.trim()) {
      alert("Por favor, preencha o nome do funcionário.");
      return;
    }
    
    if (!formData.cpf.trim()) {
      alert("Por favor, preencha o CPF do funcionário.");
      return;
    }
    
    if (!formData.role.trim()) {
      alert("Por favor, preencha a função do funcionário.");
      return;
    }
    
    if (!formData.contract_id) {
      alert("Por favor, selecione um contrato.");
      return;
    }
    
    if (!formData.admission_date) {
      alert("Por favor, selecione a data de admissão.");
      return;
    }

    if (formData.base_salary === null || formData.base_salary <= 0) {
      alert("Por favor, informe um salário base válido.");
      return;
    }

    // Uniforms validations
    if (isUniformsIncomplete()) {
      alert("Por favor, preencha todos os campos obrigatórios de medidas de uniforme para concluir este cadastro.");
      return;
    }
    if (formData.uniform_boot_size <= 0) {
      alert("Por favor, informe um tamanho válido para a bota/sapato (maior que 0).");
      return;
    }
    
    console.log("🔄 Enviando dados do funcionário para salvamento:", formData);
    
    try {
      await onSave(formData);
      console.log("✅ Funcionário salvo com sucesso via onSave");
    } catch (error) {
      console.error("❌ Erro no formulário de funcionário:", error);
      alert(`Erro ao salvar funcionário: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Dados Pessoais */}
      <div className="p-4 bg-gray-50 rounded-lg border">
        <h3 className="font-semibold mb-3 text-gray-800">Dados Pessoais</h3>
        <div className="flex items-center space-x-4 mb-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={formData.photo_url} />
            <AvatarFallback className="text-2xl bg-blue-100">
              {formData.name ? formData.name.charAt(0) : <Camera className="w-8 h-8" />}
            </AvatarFallback>
          </Avatar>
          <div>
            <Label htmlFor="photo" className="cursor-pointer text-blue-600 hover:underline">
              {isUploading ? "Enviando..." : "Escolher Foto"}
            </Label>
            <Input
              id="photo"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".jpg,.jpeg,.png,.webp"
              disabled={isUploading}
            />
            <p className="text-sm text-gray-500 mt-1">JPG, PNG ou WEBP até 5MB</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Nome Completo *</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="cpf">CPF *</Label>
            <Input id="cpf" name="cpf" value={formData.cpf} onChange={handleChange} required />
          </div>
        </div>
      </div>

      {/* Dados de Contato Adicionais */}
      <div className="p-4 bg-gray-50 rounded-lg border">
        <h3 className="font-semibold mb-3 text-gray-800">Informações de Contato</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input id="whatsapp" name="whatsapp" placeholder="+55 (XX) XXXXX-XXXX" value={formData.whatsapp} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="pix_key">Chave PIX</Label>
            <Input id="pix_key" name="pix_key" value={formData.pix_key} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="useful_link">Link Útil</Label>
            <Input id="useful_link" name="useful_link" type="url" placeholder="https://..." value={formData.useful_link} onChange={handleChange} />
          </div>
        </div>
      </div>

      {/* 🧵 Medidas & Tamanhos de Uniforme */}
      <div className="p-4 bg-indigo-50 rounded-lg border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-indigo-900">🧵 Medidas & Tamanhos de Uniforme</h3>
          {isUniformsIncomplete() && (
            <div className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded">
              Preencha os tamanhos de uniforme para concluir este cadastro
            </div>
          )}
        </div>
        <TooltipProvider>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Tamanho da Camisa *</Label>
              <Select value={formData.uniform_shirt_size} onValueChange={(v)=>handleSelectChange("uniform_shirt_size", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {["PP","P","M","G","GG","XG"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tamanho da Calça *</Label>
              <Input name="uniform_pants_size" value={formData.uniform_pants_size} onChange={handleChange} placeholder="Ex.: 36, 42, 58" />
            </div>
            <div>
              <Label>Modelagem da Calça *</Label>
              <Select value={formData.uniform_pants_modeling} onValueChange={(v)=>handleSelectChange("uniform_pants_modeling", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="masc">Masculina</SelectItem>
                  <SelectItem value="fem">Feminina</SelectItem>
                  <SelectItem value="unisex">Unissex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tamanho da Bota/Sapato *</Label>
              <Input type="number" step="1" min="30" max="50" name="uniform_boot_size" value={formData.uniform_boot_size} onChange={handleChange} placeholder="Ex.: 39, 41" />
            </div>
            <div className="flex items-center gap-2">
              <input id="uniform_boot_steel_toe" type="checkbox" name="uniform_boot_steel_toe" checked={!!formData.uniform_boot_steel_toe} onChange={handleChange} className="h-4 w-4" />
              <Label htmlFor="uniform_boot_steel_toe">Bico de aço?</Label>
            </div>
            <div>
              <Label>Tamanho do Agasalho/Jaqueta *</Label>
              <Select value={formData.uniform_jacket_size} onValueChange={(v)=>handleSelectChange("uniform_jacket_size", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {["PP","P","M","G","GG","XG"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tamanho das Luvas *</Label>
              <Select value={formData.uniform_gloves_size} onValueChange={(v)=>handleSelectChange("uniform_gloves_size", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {["PP","P","M","G","GG"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tamanho do Boné/Capacete *</Label>
              <Select value={formData.uniform_hat_size} onValueChange={(v)=>handleSelectChange("uniform_hat_size", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {["P","M","G"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <div className="flex items-center gap-2">
                <Label>Observações de Uniformes *</Label>
                <Tooltip>
                  <TooltipTrigger className="text-xs text-gray-500 underline">exemplo</TooltipTrigger>
                  <TooltipContent>Ex.: Preferência por calça com elástico; Jaqueta unissex; Botina sem cadarço.</TooltipContent>
                </Tooltip>
              </div>
              <Textarea name="uniform_notes" value={formData.uniform_notes} onChange={handleChange} rows={2} placeholder="Detalhes importantes para compra/entrega" />
            </div>
          </div>
        </TooltipProvider>
      </div>

      {/* Dados do Contrato e Função */}
      <div className="p-4 bg-gray-50 rounded-lg border">
        <h3 className="font-semibold mb-3 text-gray-800">Dados do Contrato e Função</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="role">Função *</Label>
            <Input id="role" name="role" value={formData.role} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="unidade">Unidade (Opcional)</Label>
            <Input id="unidade" name="unidade" value={formData.unidade} onChange={handleChange} placeholder="Ex: Matriz, Filial SP" />
          </div>
          <div>
            <Label htmlFor="contract_id">Contrato Vinculado *</Label>
            <Select name="contract_id" value={formData.contract_id} onValueChange={(v) => handleSelectChange("contract_id", v)} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o contrato" />
              </SelectTrigger>
              <SelectContent>
                {contracts && contracts.length > 0 ? (
                  contracts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
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
            <Label htmlFor="admission_date">Data de Admissão *</Label>
            <Input type="date" id="admission_date" name="admission_date" value={formData.admission_date} onChange={handleChange} required />
          </div>

          {/* Novo: Data de Desligamento (opcional) */}
          <div>
            <Label htmlFor="dismissal_date">Data de Desligamento (Opcional)</Label>
            <Input
              type="date"
              id="dismissal_date"
              name="dismissal_date"
              value={formData.dismissal_date}
              onChange={handleChange}
            />
          </div>

          <div>
            <Label htmlFor="work_shift">Turno de Trabalho *</Label>
            <Select name="work_shift" value={formData.work_shift} onValueChange={(v) => handleSelectChange("work_shift", v)} required>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manha">Manhã</SelectItem>
                <SelectItem value="tarde">Tarde</SelectItem>
                <SelectItem value="noite">Noite</SelectItem>
                <SelectItem value="comercial">Comercial</SelectItem>
                <SelectItem value="escala_12x36">Escala 12x36</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select name="status" value={formData.status} onValueChange={(v) => handleSelectChange("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="ferias">Férias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* NOVO: Marcação de Ferista */}
          <div className="md:col-span-2 flex items-center gap-2">
            <input
              id="is_ferista"
              name="is_ferista"
              type="checkbox"
              checked={!!formData.is_ferista}
              onChange={handleChange}
              className="h-4 w-4"
            />
            <Label htmlFor="is_ferista">Ferista (cobertura/substituição)</Label>
          </div>
        </div>
      </div>

      {/* Salário e Benefícios */}
      <div className="p-4 bg-gray-50 rounded-lg border">
        <h3 className="font-semibold mb-3 text-gray-800">Salário e Benefícios</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="base_salary">Salário Base (R$) *</Label>
            <Input type="number" step="0.01" id="base_salary" name="base_salary" value={formData.base_salary} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="meal_allowance">Vale Alimentação (R$)</Label>
            <Input type="number" step="0.01" id="meal_allowance" name="meal_allowance" value={formData.meal_allowance} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="transport_allowance">Vale Transporte (R$)</Label>
            <Input type="number" step="0.01" id="transport_allowance" name="transport_allowance" value={formData.transport_allowance} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="health_plan">Plano de Saúde (R$)</Label>
            <Input type="number" step="0.01" id="health_plan" name="health_plan" value={formData.health_plan} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="other_benefits">Outros Benefícios (R$)</Label>
            <Input type="number" step="0.01" id="other_benefits" name="other_benefits" value={formData.other_benefits} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="social_charges_percentage">Encargos Sociais (%)</Label>
            <Input type="number" step="0.1" id="social_charges_percentage" name="social_charges_percentage" value={formData.social_charges_percentage} onChange={handleChange} />
          </div>
        </div>
      </div>

      {/* Resumo de Custos */}
      <div className="p-4 bg-gray-50 rounded-lg border">
        <h3 className="font-semibold mb-3 text-gray-800">📊 Resumo de Custos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label>Salário Total</Label>
            <div className="p-2 bg-white border rounded text-lg font-semibold text-blue-600">
              {formatCurrency(formData.total_salary)}
            </div>
            <div className="text-xs text-gray-600">Salário + VA + VT</div>
          </div>
          <div>
            <Label>Custo com Benefícios</Label>
            <div className="p-2 bg-white border rounded text-lg font-semibold text-green-600">
              {formatCurrency(formData.benefits_cost)}
            </div>
            <div className="text-xs text-gray-600">Plano + Outros</div>
          </div>
          <div>
            <Label>Encargos Sociais</Label>
            <div className="p-2 bg-white border rounded text-lg font-semibold text-orange-600">
              {formatCurrency(formData.social_charges_cost)}
            </div>
            <div className="text-xs text-gray-600">{formData.social_charges_percentage}% do salário</div>
          </div>
          <div>
            <Label>Custo Total</Label>
            <div className="p-2 bg-white border rounded text-xl font-bold text-red-600">
              {formatCurrency(formData.total_cost)}
            </div>
            <div className="text-xs text-gray-600">Total geral</div>
          </div>
        </div>
      </div>

      {/* Observações */}
      <div className="p-4 bg-gray-50 rounded-lg border">
        <h3 className="font-semibold mb-3 text-gray-800">Observações</h3>
        <div>
          <Label htmlFor="observations" className="sr-only">Observações</Label>
          <Textarea
            id="observations"
            name="observations"
            value={formData.observations}
            onChange={handleChange}
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {employee ? "Atualizar Funcionário" : "Cadastrar Funcionário"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
