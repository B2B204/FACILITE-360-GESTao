
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { UserInvite } from "@/api/entities";
import { TeamMember } from "@/api/entities";
import { User } from "@/api/entities";
import { UserPlus, AlertCircle, CheckCircle, Loader2, Copy, Send } from "lucide-react";

export default function UserInviteModal({ isOpen, onClose, currentUser, onSuccess }) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    department: "operador"
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [inviteLink, setInviteLink] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
    setSuccess(false);
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
    setSuccess(false);
  };

  const generateInviteCode = () => {
    return `INV-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess(false);
    
    try {
      if (!formData.full_name.trim() || !formData.email.trim() || !formData.email.includes('@')) {
        throw new Error("Por favor, preencha nome e e-mail válidos.");
      }
      
      const emailToCheck = formData.email.toLowerCase();

      // Verificar se já existe um usuário ou membro ativo com este email no mesmo CNPJ
      const [existingUsers, existingTeamMembers, pendingInvites] = await Promise.all([
         User.filter({ email: emailToCheck, cnpj: currentUser.cnpj }),
         TeamMember.filter({ email: emailToCheck, cnpj: currentUser.cnpj }),
         UserInvite.filter({ email: emailToCheck, cnpj: currentUser.cnpj, status: 'pendente' })
      ]);
      
      if (existingUsers.length > 0 || existingTeamMembers.length > 0) {
        throw new Error("Um usuário com este e-mail já faz parte da equipe.");
      }

      // Verificar convites pendentes e não expirados
      const now = new Date();
      const validPendingInvites = pendingInvites.filter(invite => new Date(invite.expires_at) > now);

      if (validPendingInvites.length > 0) {
        throw new Error("Já existe um convite pendente e válido para este e-mail.");
      }

      const inviteCode = generateInviteCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Convite válido por 7 dias

      const inviteData = {
        full_name: formData.full_name,
        email: emailToCheck,
        department: formData.department,
        invite_code: inviteCode,
        status: "pendente",
        invited_by: currentUser.email,
        cnpj: currentUser.cnpj,
        expires_at: expiresAt.toISOString()
      };

      await UserInvite.create(inviteData);

      const baseUrl = window.location.origin;
      const generatedLink = `${baseUrl}/AcceptInvite?code=${inviteCode}`;
      setInviteLink(generatedLink);

      setSuccess(true);
      
    } catch (err) {
      console.error("❌ Erro ao criar convite:", err);
      setError(err.message || "Ocorreu um erro ao criar o convite. Tente novamente.");
    }
    setIsSaving(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert("Link de convite copiado!");
  };

  const resetForm = () => {
     setFormData({ full_name: "", email: "", department: "operador" });
     setError("");
     setSuccess(false);
     setInviteLink("");
  }

  const handleClose = () => {
    if (success) {
        onSuccess(); // Recarrega os dados na página de perfil
    }
    resetForm();
    onClose();
  };

  const handleCreateAnother = () => {
    onSuccess(); // Recarrega os dados para mostrar o convite recém-criado
    resetForm();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserPlus className="w-5 h-5 mr-2" />
            Adicionar Membro da Equipe
          </DialogTitle>
          <DialogDescription>
            Crie um convite para um novo membro se juntar à sua equipe.
          </DialogDescription>
        </DialogHeader>
        
        {success ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">Convite Criado!</h3>
            <p className="text-sm text-gray-600 mb-4">
              Copie o link abaixo e envie para <strong>{formData.full_name}</strong>. O link é válido por 7 dias.
            </p>
            <div className="flex items-center space-x-2 bg-gray-100 p-2 rounded-lg">
              <Input
                readOnly
                value={inviteLink}
                className="flex-1 bg-white"
              />
              <Button size="icon" onClick={handleCopyLink}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <div className="mt-6 flex justify-center space-x-4">
               <Button variant="outline" onClick={handleCreateAnother}>
                Criar Outro Convite
              </Button>
              <Button onClick={handleClose}>
                Fechar
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div>
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleChange} required disabled={isSaving} />
            </div>
            
            <div>
              <Label htmlFor="email">E-mail *</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required disabled={isSaving} />
            </div>

            <div>
              <Label htmlFor="department">Função *</Label>
              <Select name="department" value={formData.department} onValueChange={(v) => handleSelectChange("department", v)} disabled={isSaving}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="rh">RH</SelectItem>
                  <SelectItem value="operador">Visualização</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="flex items-center text-sm text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando convite...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> Criar Convite</>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
