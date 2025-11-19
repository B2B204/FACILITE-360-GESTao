import React, { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, ArrowRight, Heart, Shield, Users, Star, CheckCircle } from "lucide-react";

export default function LogoutSuccessPage() {
  useEffect(() => {
    // Limpar qualquer dado local que possa restar
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      console.log("Limpeza de dados concluída");
    }
  }, []);

  const handleBackToLogin = () => {
    window.location.href = window.location.origin;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <Card className="shadow-2xl border-0 overflow-hidden">
          <CardContent className="p-0">
            {/* Header com gradiente mais elaborado */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 p-12 text-center text-white relative overflow-hidden">
              {/* Elementos decorativos de fundo */}
              <div className="absolute inset-0 bg-black bg-opacity-10"></div>
              <div className="absolute top-10 left-10 w-20 h-20 bg-white bg-opacity-10 rounded-full"></div>
              <div className="absolute bottom-10 right-10 w-32 h-32 bg-white bg-opacity-5 rounded-full"></div>
              
              <div className="relative z-10">
                <div className="flex justify-center mb-6">
                  <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Building2 className="w-12 h-12" />
                  </div>
                </div>
                <h1 className="text-5xl font-bold mb-4">FaciliGestor360°</h1>
                <p className="text-xl text-blue-100 mb-2">Sua Plataforma de Gestão de Facilities</p>
                <p className="text-blue-200 text-sm">Facilitando sua gestão com tecnologia e inovação</p>
              </div>
            </div>

            {/* Conteúdo principal expandido */}
            <div className="p-12 text-center">
              <div className="text-8xl mb-8 animate-bounce">👋</div>
              
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
                Obrigado e até logo!
              </h2>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
                Sua sessão foi encerrada com <strong className="text-green-600">total segurança</strong>. 
                Agradecemos por confiar no FaciliGestor360 para transformar a gestão dos seus contratos 
                e facilitar o dia a dia da sua equipe.
              </p>

              {/* Grid de benefícios expandido */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                  <Shield className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-blue-900 mb-2">Dados Protegidos</h4>
                  <p className="text-sm text-blue-700">Suas informações estão seguras com criptografia avançada</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                  <Users className="w-10 h-10 text-green-600 mx-auto mb-3" />
                  <p className="font-semibold text-green-900 mb-2">Equipe Conectada</p>
                  <p className="text-sm text-green-700">Gestão colaborativa e eficiente para todos</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                  <Star className="w-10 h-10 text-purple-600 mx-auto mb-3" />
                  <p className="font-semibold text-purple-900 mb-2">Sempre Evoluindo</p>
                  <p className="text-sm text-purple-700">Novos recursos e melhorias constantes</p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-pink-100 p-6 rounded-xl border border-red-200">
                  <Heart className="w-10 h-10 text-red-500 mx-auto mb-3" />
                  <p className="font-semibold text-red-900 mb-2">Feito com Carinho</p>
                  <p className="text-sm text-red-700">Desenvolvido pensando nas suas necessidades</p>
                </div>
              </div>

              {/* Seção de destaque expandida */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8 mb-8 border border-gray-200">
                <div className="flex justify-center mb-4">
                  <CheckCircle className="w-16 h-16 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">🌟 Volte sempre que precisar!</h3>
                <p className="text-gray-700 text-lg mb-6 max-w-3xl mx-auto leading-relaxed">
                  O FaciliGestor360 estará sempre aqui, pronto para ajudar você a gerenciar seus contratos, 
                  equipes, financeiro, patrimônio e muito mais. Transformamos a complexidade da gestão de 
                  facilities em uma experiência simples e eficiente.
                </p>
                
                {/* Lista de funcionalidades */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-6">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Contratos Inteligentes
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Gestão Financeira
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    Controle Patrimonial
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    Relatórios Avançados
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleBackToLogin}
                size="lg"
                className="bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 hover:from-blue-700 hover:via-indigo-800 hover:to-purple-900 text-white px-12 py-4 text-xl font-bold shadow-xl transform transition-all duration-300 hover:scale-105"
              >
                Acessar FaciliGestor360 Novamente
                <ArrowRight className="w-6 h-6 ml-3" />
              </Button>
            </div>

            {/* Footer mais elaborado */}
            <div className="bg-gradient-to-r from-gray-100 to-blue-100 px-12 py-6 text-center border-t">
              <div className="mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">💼 FaciliGestor360 - A revolução na gestão de facilities</h4>
                <p className="text-sm text-gray-600 max-w-2xl mx-auto">
                  Plataforma completa para empresas que buscam excelência operacional, 
                  controle financeiro e gestão eficiente de contratos e equipes.
                </p>
              </div>
              <div className="flex justify-center space-x-6 mb-4 text-xs text-gray-500">
                <span>🔒 Seguro & Confiável</span>
                <span>🚀 Sempre Atualizado</span>
                <span>📱 Mobile Friendly</span>
                <span>⚡ Super Rápido</span>
              </div>
              <p className="text-sm text-gray-500">
                © 2025 FaciliGestor360. Facilitando sua gestão com tecnologia de ponta.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}