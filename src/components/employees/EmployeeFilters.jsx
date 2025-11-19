
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, X, ChevronDown } from 'lucide-react'; // ChevronUp is no longer explicitly needed due to rotate class

export default function EmployeeFilters({
  contracts,
  onFiltersChange,
  totalResults = 0,
  isLoading = false
}) {
  const [filters, setFilters] = useState({
    name: '',
    cpf: '',
    role: '',
    contract_id: '',
    unidade: '',
    status: '',
    admission_date_from: '',
    admission_date_to: '',
    dismissal_date_from: '',
    dismissal_date_to: '',
    email: '',
    whatsapp: '',
    // Uniform filters
    uniform_shirt_size: '',
    uniform_pants_size: '',
    uniform_boot_size: '',
    uniform_jacket_size: '',
    uniform_gloves_size: '',
    uniform_hat_size: '',
    missing_sizes: false
  });
  const [isExpanded, setIsExpanded] = useState(false);

  // Unified change handler for all filter inputs
  const handleChange = (e) => {
    // For regular input events (e.g., from Input component)
    let name = e.target.name;
    let value = e.target.value;
    
    // Ensure null from Select (for "Todos") is treated as empty string for consistency with initial state
    if (value === null) {
        value = '';
    }

    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters); // Propagate changes up to parent component
  };

  const handleToggleMissing = (checked) => {
    const newFilters = { ...filters, missing_sizes: !!checked };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const emptyFilters = {
      name: '',
      cpf: '',
      role: '',
      contract_id: '',
      unidade: '',
      status: '',
      admission_date_from: '',
      admission_date_to: '',
      dismissal_date_from: '',
      dismissal_date_to: '',
      email: '',
      whatsapp: '',
      uniform_shirt_size: '',
      uniform_pants_size: '',
      uniform_boot_size: '',
      uniform_jacket_size: '',
      uniform_gloves_size: '',
      uniform_hat_size: '',
      missing_sizes: false
    };
    setFilters(emptyFilters);
    onFiltersChange(emptyFilters); // Propagate cleared filters
  };

  const hasActiveFilters = Object.values(filters).some(value => {
    if (typeof value === 'boolean') {
      return value === true; // Checkbox filter
    }
    return value !== ''; // Text/select filters
  });

  return (
    <Card className="mb-6">
      <CardHeader>
        {/* Click handler moved to an inner div for better control */}
        <div 
          className="flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors py-2 px-4 -mx-4 -mt-4 rounded-t-lg" // Added padding and negative margin to make click area larger
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <CardTitle className="flex items-center text-lg font-semibold">
            <Filter className="w-5 h-5 mr-3 text-gray-600" />
            Filtros Avançados ({isLoading ? 'Carregando...' : `${totalResults} encontrados`})
          </CardTitle>
          <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input 
              placeholder="Nome do Funcionário" 
              name="name" 
              value={filters.name} 
              onChange={handleChange} 
            />
            <Input 
              placeholder="CPF" 
              name="cpf" 
              value={filters.cpf} 
              onChange={handleChange} 
            />
            <Input 
              placeholder="Cargo/Função" 
              name="role" 
              value={filters.role} 
              onChange={handleChange} 
            />
            <Input 
              placeholder="Unidade" 
              name="unidade" 
              value={filters.unidade} 
              onChange={handleChange} 
            />
            <Input 
              placeholder="E-mail" 
              name="email" 
              value={filters.email} 
              onChange={handleChange} 
            />
            <Input 
              placeholder="WhatsApp" 
              name="whatsapp" 
              value={filters.whatsapp} 
              onChange={handleChange} 
            />

            <Select 
              name="contract_id" 
              value={filters.contract_id} 
              onValueChange={(v) => handleChange({ target: { name: 'contract_id', value: v }})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os contratos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Todos os contratos</SelectItem>
                {contracts.map(contract => (
                  <SelectItem key={contract.id} value={contract.id}>
                    {contract.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              name="status" 
              value={filters.status} 
              onValueChange={(v) => handleChange({ target: { name: 'status', value: v }})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Todos os status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Demitido</SelectItem>
                <SelectItem value="ferias">Férias</SelectItem>
              </SelectContent>
            </Select>

            <div className="space-y-1">
              <Label htmlFor="admission_date_from" className="text-xs">Admissão (De)</Label>
              <Input
                id="admission_date_from"
                type="date"
                name="admission_date_from"
                value={filters.admission_date_from}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="admission_date_to" className="text-xs">Admissão (Até)</Label>
              <Input
                id="admission_date_to"
                type="date"
                name="admission_date_to"
                value={filters.admission_date_to}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dismissal_date_from" className="text-xs">Demissão (De)</Label>
              <Input
                id="dismissal_date_from"
                type="date"
                name="dismissal_date_from"
                value={filters.dismissal_date_from}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dismissal_date_to" className="text-xs">Demissão (Até)</Label>
              <Input
                id="dismissal_date_to"
                type="date"
                name="dismissal_date_to"
                value={filters.dismissal_date_to}
                onChange={handleChange}
              />
            </div>

            {/* Uniform filters */}
            <Select name="uniform_shirt_size" value={filters.uniform_shirt_size} onValueChange={(v)=>handleChange({ target: { name: 'uniform_shirt_size', value: v }})}>
              <SelectTrigger><SelectValue placeholder="Camisa (todos)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Todos</SelectItem>
                {["PP","P","M","G","GG","XG"].map(s=> <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>

            <Input placeholder="Calça (ex.: 44)" name="uniform_pants_size" value={filters.uniform_pants_size} onChange={handleChange} />

            <Input placeholder="Bota (ex.: 41)" name="uniform_boot_size" type="number" value={filters.uniform_boot_size} onChange={handleChange} />

            <Select name="uniform_jacket_size" value={filters.uniform_jacket_size} onValueChange={(v)=>handleChange({ target: { name: 'uniform_jacket_size', value: v }})}>
              <SelectTrigger><SelectValue placeholder="Jaqueta (todos)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Todos</SelectItem>
                {["PP","P","M","G","GG","XG"].map(s=> <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select name="uniform_gloves_size" value={filters.uniform_gloves_size} onValueChange={(v)=>handleChange({ target: { name: 'uniform_gloves_size', value: v }})}>
              <SelectTrigger><SelectValue placeholder="Luvas (todos)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Todos</SelectItem>
                {["PP","P","M","G","GG"].map(s=> <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select name="uniform_hat_size" value={filters.uniform_hat_size} onValueChange={(v)=>handleChange({ target: { name: 'uniform_hat_size', value: v }})}>
              <SelectTrigger><SelectValue placeholder="Boné/Capacete (todos)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Todos</SelectItem>
                {["P","M","G"].map(s=> <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Checkbox id="missing_sizes" checked={filters.missing_sizes} onCheckedChange={handleToggleMissing} />
              <Label htmlFor="missing_sizes">Faltando tamanhos</Label>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={handleClearFilters}
              variant="outline"
              size="sm"
              disabled={!hasActiveFilters}
            >
              <X className="w-4 h-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
