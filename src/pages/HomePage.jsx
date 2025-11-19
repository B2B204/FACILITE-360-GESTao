import React, { useEffect, useState } from "react";
import { User } from "@/api/entities";
import { TeamMember } from "@/api/entities";

export default function HomePage() {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkUserStatusAndRedirect();
  }, []);

  const checkUserStatusAndRedirect = async () => {
    try {
      // Tentar verificar se o usuário já está logado
      const currentUser = await User.me();
      
      if (currentUser) {
        console.log("✅ Usuário já autenticado:", currentUser.email);
        
        // Verificar se é TeamMember ativo
        const teamMembers = await TeamMember.filter({ email: currentUser.email });
        
        if (teamMembers.length > 0 && teamMembers[0].status === 'ativo') {
          console.log("🎯 TeamMember ativo detectado, redirecionando para dashboard");
          window.location.href = window.location.origin + "/Dashboard";
          return;
        }
        
        // Verificar se é admin com plano ativo
        if (currentUser.plan_status === 'active' || currentUser.plan_status === 'demo') {
          console.log("🎯 Admin com plano ativo, redirecionando para dashboard");
          window.location.href = window.location.origin + "/Dashboard";
          return;
        }
      }
    } catch (error) {
      console.log("ℹ️ Usuário não autenticado, prosseguindo com login normal");
    }
    
    // Se chegou até aqui, fazer o fluxo normal de login
    const loginUrl = "https://app.base44.com/login?redirect=" + 
                    encodeURIComponent(window.location.origin + "/Dashboard");
    window.location.href = loginUrl;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">
          {isChecking ? "Verificando seu acesso..." : "Redirecionando para o sistema..."}
        </p>
      </div>
    </div>
  );
}