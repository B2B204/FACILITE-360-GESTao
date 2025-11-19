
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserInvite } from "@/api/entities";
import { TeamMember } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, AlertTriangle, CheckCircle, PartyPopper } from "lucide-react";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";

export default function AcceptInvite() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading"); // loading, valid, invalid, expired, success, error
  const [inviteDetails, setInviteDetails] = useState(null);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const validateInvite = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get("code");

      if (!code) {
        setStatus("invalid");
        setError("Código de convite não encontrado na URL.");
        return;
      }

      try {
        const invites = await UserInvite.filter({ invite_code: code, status: "pendente" });

        if (invites.length === 0) {
          setStatus("invalid");
          setError("Este convite é inválido ou já foi utilizado.");
          return;
        }

        const invite = invites[0];
        const now = new Date();
        const expiresAt = new Date(invite.expires_at);

        if (now > expiresAt) {
          await UserInvite.update(invite.id, { status: 'expirado' });
          setStatus("expired");
          setError("Este convite expirou. Por favor, solicite um novo convite ao administrador.");
          return;
        }

        setInviteDetails(invite);
        setStatus("valid");

      } catch (err) {
        setStatus("error");
        setError("Ocorreu um erro ao validar seu convite. Tente novamente mais tarde.");
        console.error("Erro ao validar convite:", err);
      }
    };

    validateInvite();
  }, [location.search]);
  
  const handleAccept = async () => {
    setIsProcessing(true);
    setError("");

    try {
        // Step 1: Check if the TeamMember already exists for this CNPJ and email
        const existingTeamMembers = await TeamMember.filter({
            email: inviteDetails.email,
            cnpj: inviteDetails.cnpj
        });

        const newMemberData = {
            full_name: inviteDetails.full_name,
            email: inviteDetails.email,
            department: inviteDetails.department,
            cnpj: inviteDetails.cnpj,
            status: 'ativo', // Set as active upon acceptance
            created_by: inviteDetails.invited_by,
        };

        if (existingTeamMembers.length > 0) {
            // Step 2: If TeamMember exists, update it
            const existingMember = existingTeamMembers[0];
            await TeamMember.update(existingMember.id, newMemberData);
        } else {
            // Step 3: If TeamMember does not exist, create a new one
            await TeamMember.create(newMemberData);
        }
        
        // Step 4: Update the UserInvite status to "aceito"
        await UserInvite.update(inviteDetails.id, { status: 'aceito' });

        setStatus("success");

    } catch (err) {
        setStatus("error");
        setError("Não foi possível processar seu convite. Verifique com o administrador se você já faz parte da equipe ou se o convite já foi aceito.");
        console.error("Erro ao aceitar convite:", err);
    } finally {
        setIsProcessing(false);
    }
  };
  
  const redirectToLogin = () => {
      // Redireciona para a página de login da Base44, que por sua vez
      // redirecionará para o dashboard do app após o login.
      const loginUrl = "https://app.base44.com/login?redirect=" +
                      encodeURIComponent(window.location.origin + createPageUrl("Dashboard"));
      window.location.href = loginUrl;
  };

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="flex flex-col items-center justify-center text-center p-8">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
            <p className="text-lg text-gray-700">Validando convite...</p>
          </div>
        );
      case "valid":
        return (
            <>
                <CardHeader>
                    <CardTitle className="flex items-center justify-center text-2xl">
                        <PartyPopper className="w-8 h-8 mr-3 text-blue-600"/>
                        Você foi convidado!
                    </CardTitle>
                    <CardDescription className="text-center">
                        Você está prestes a se juntar à equipe.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-lg font-semibold text-blue-900">{inviteDetails.full_name}</p>
                        <p className="text-gray-600">{inviteDetails.email}</p>
                        <p className="text-sm text-gray-500 capitalize mt-2">Função: {inviteDetails.department}</p>
                    </div>
                    <p className="text-sm text-gray-500">
                        Ao aceitar, você poderá acessar o sistema com seu e-mail e senha (via login Google).
                    </p>
                    <Button onClick={handleAccept} disabled={isProcessing} className="w-full" size="lg">
                        {isProcessing ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processando...</>
                        ) : "Aceitar Convite e Entrar"}
                    </Button>
                </CardContent>
            </>
        );
      case "success":
        return (
            <>
                <CardHeader>
                    <CardTitle className="flex items-center justify-center text-2xl">
                        <CheckCircle className="w-10 h-10 mr-3 text-green-600"/>
                        Tudo Certo!
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                     <p className="text-lg text-gray-800">Seu acesso foi liberado com sucesso.</p>
                     <p className="text-gray-600">
                        Você será redirecionado para a página de login para acessar o sistema.
                     </p>
                    <Button onClick={redirectToLogin} className="w-full bg-green-600 hover:bg-green-700" size="lg">
                        Ir para o Login
                    </Button>
                </CardContent>
            </>
        );
      case "invalid":
      case "expired":
      case "error":
        return (
            <>
                <CardHeader>
                    <CardTitle className="flex items-center justify-center text-2xl">
                        <AlertTriangle className="w-10 h-10 mr-3 text-red-600"/>
                        Ops! Algo deu errado.
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                     <p className="text-lg text-red-800">{error}</p>
                     <p className="text-gray-600">
                        Se o problema persistir, entre em contato com o administrador da sua empresa.
                     </p>
                     <Button onClick={redirectToLogin} variant="outline" className="w-full">
                        Voltar para o Login
                    </Button>
                </CardContent>
            </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        {renderContent()}
      </Card>
    </div>
  );
}
