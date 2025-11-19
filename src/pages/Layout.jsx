

import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
// src/pages/Layout.jsx
import React from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { DropdownMenuTrigger } from "@components/ui/dropdown-menu";
import { hasPageAccess } from "@components/permissions";
import AccessDeniedPage from "./AccessDeniedPage";

// Menu principal — ajuste como quiser
const menu = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Financeiro", path: "/financial" },
  { name: "Contratos", path: "/contracts" },
  { name: "Funcionários", path: "/employees" },
  { name: "Ofícios", path: "/oficios" },
  { name: "CRM", path: "/crm" },
];

export default function Layout({ user }) {
  const location = useLocation();
  const pageName =
    menu.find((item) => item.path === location.pathname)?.name || "Sistema";

  // Proteção de página
  if (!hasPageAccess(user, location.pathname)) {
    // src/pages/Layout.jsx
    import React from "react";
    import { Outlet, useLocation, Link } from "react-router-dom";
    import { DropdownMenuTrigger } from "@components/ui/dropdown-menu";
    import { hasPageAccess } from "@components/permissions";
    import AccessDeniedPage from "./AccessDeniedPage";

    // Menu lateral
    const menu = [
      { name: "Dashboard", path: "/dashboard" },
      { name: "Financeiro", path: "/financial" },
      { name: "Contratos", path: "/contracts" },
      { name: "Funcionários", path: "/employees" },
      { name: "Ofícios", path: "/oficios" },
      { name: "CRM", path: "/crm" },
    ];

    export default function Layout({ user }) {
      const location = useLocation();

      const pageName =
        menu.find((item) => item.path === location.pathname)?.name ||
        "Sistema";

      // Verificação de permissão
      if (!hasPageAccess(user, location.pathname)) {
        return <AccessDeniedPage />;
      }

      return (
        <div className="flex h-screen bg-gray-100">
      
          {/* Sidebar */}
          <aside className="w-64 bg-white shadow-sm p-4 flex flex-col">
            <h1 className="text-xl font-semibold mb-6">FACILITE-360 Gestão</h1>

            <nav className="flex flex-col gap-2">
              {menu.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded text-sm ${
                    location.pathname === item.path
                      ? "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Conteúdo Principal */}
          <main className="flex-1 p-6 overflow-auto">
            <header className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">{pageName}</h2>

              <DropdownMenuTrigger>
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center cursor-pointer">
                  {user?.name?.[0] || "U"}
                </div>
              </DropdownMenuTrigger>
            </header>

            <Outlet />
          </main>

        </div>
      );
    }
    ],
  },

  { type: "link", title: "Suporte", url: createPageUrl("Support"), icon: LifeBuoy },
];


export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [openMenu, setOpenMenu] = useState(null);

  useEffect(() => {
    // Abrir automaticamente o grupo que contém a página ativa
    const activeMenu = navItems.find(
      (item) => item.subItems && item.subItems.some((sub) => sub.url === location.pathname)
    );
    if (activeMenu) setOpenMenu(activeMenu.title);
  }, [location.pathname]);

  useEffect(() => {
    // Páginas públicas não precisam de autenticação
    const publicPages = ['AcceptInvite'];
    if (publicPages.includes(currentPageName)) {
      setIsLoadingUser(false);
      return;
    }
    loadUser();
  }, [currentPageName]);

  const loadUser = async () => {
    setIsLoadingUser(true);
    try {
      const currentUser = await User.me();
      console.log("👤 Usuário autenticado no FaciliGestor360:", currentUser);

      // PRIMEIRO: Verificar se é um membro da equipe convidado
      let teamMembers = [];
      try {
        teamMembers = await TeamMember.filter({ email: currentUser.email });
        console.log("🔍 Buscando TeamMembers para:", currentUser.email, "Encontrados:", teamMembers.length);
      } catch (error) {
        console.log("⚠️ Erro ao buscar TeamMembers:", error);
      }

      if (teamMembers.length > 0) {
        // É um membro convidado - verificar se está ativo
        const memberData = teamMembers[0];
        console.log("📋 Dados do TeamMember:", memberData);
        
        if (memberData.status === 'ativo') {
          // Usuário convidado ATIVO - dar acesso direto
          const hybridUser = {
            ...currentUser,
            department: memberData.department,
            cnpj: memberData.cnpj,
            is_team_member: true // Flag para identificar
          };

          setUser(hybridUser);
          setIsSubscriptionActive(true); // ✅ ACESSO DIRETO
          console.log("✅ TeamMember ATIVO encontrado. Acesso concedido automaticamente:", hybridUser.email);
          
        } else {
          // Membro convidado mas INATIVO
          console.log("❌ TeamMember encontrado mas INATivo:", memberData.status);
          setIsSubscriptionActive(false);
          setUser({
            ...currentUser,
            department: memberData.department,
            cnpj: memberData.cnpj,
            is_team_member: true,
            member_status: memberData.status
          });
        }
      } else {
        // É o usuário principal (administrador da conta)
        console.log("👑 Usuário é o proprietário da conta (Admin)");
        setUser(currentUser);
        
        // Para admins, verificar o status do plano normalmente
        if (currentUser?.plan_status === 'active' || currentUser?.plan_status === 'demo') {
          setIsSubscriptionActive(true);
          console.log("✅ Admin com plano ativo:", currentUser.plan_status);
        } else {
          setIsSubscriptionActive(false);
          console.log("❌ Admin sem plano ativo:", currentUser.plan_status);
        }
      }

    } catch (error) {
      // Personalizar mensagem de erro sem mencionar Base44
      console.warn("❌ Sessão expirada. Redirecionando para autenticação.", error);
      
      // Mostrar tela personalizada antes do redirecionamento
      const authOverlay = document.createElement('div');
      authOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;
      
      authOverlay.innerHTML = `
        <div style="text-align: center; max-width: 400px; padding: 40px;">
          <img src="${BRAND.logoUrl}" alt="${BRAND.name}" style="height:56px; margin-bottom:16px; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;" />
          <h2 style="font-size: 28px; margin-bottom: 16px;">Sessão Expirada</h2>
          <p style="font-size: 18px; margin-bottom: 24px; opacity: 0.9;">
            Por segurança, você precisa fazer login novamente no ${BRAND.name}.
          </p>
          <p style="font-size: 16px; opacity: 0.8;">
            Redirecionando para área de login...
          </p>
          <div style="margin-top: 30px;">
            <div style="width: 40px; height: 40px; border: 3px solid white; border-top: 3px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
          </div>
        </div>
        <style>
          @keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
        </style>
      `;
      
      document.body.appendChild(authOverlay);
      
      setTimeout(() => {
        // Substitui redirecionamento externo por método nativo, sem referência a provedores externos
        try {
          const callbackUrl = window.location.href;
          User.loginWithRedirect(callbackUrl);
        } catch (e) {
          // fallback
          window.location.reload();
        }
      }, 2500);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handleSubscriptionUpdate = () => {
    setTimeout(() => {
      loadUser();
    }, 500);
  };

  const handleLogout = async () => {
    if (window.confirm("Tem certeza que deseja sair do FaciliGestor360?")) {
      try {
        const logoutOverlay = document.createElement('div');
        logoutOverlay.style.cssText = `
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;
          display: flex; flex-direction: column; justify-content: center; align-items: center;
          z-index: 9999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        logoutOverlay.innerHTML = `
          <div style="text-align: center; max-width: 500px; padding: 40px; animation: fadeIn 0.5s ease-in;">
            <img src="${BRAND.logoUrl}" alt="${BRAND.name}" style="height:64px; margin-bottom:20px; image-rendering: -webkit-optimize-contrast; image-rendering: crisp-edges;" />
            <h2 style="font-size: 28px; margin-bottom: 16px; font-weight: 700;">Até breve!</h2>
            <p style="font-size: 18px; margin-bottom: 24px; opacity: 0.95;">Sua sessão está sendo finalizada com segurança.</p>
            <div style="margin-top: 10px;">
              <div style="width: 50px; height: 50px; border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            </div>
          </div>
          <style>
            @keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
            @keyframes fadeIn { 0% { opacity: 0; transform: translateY(20px);} 100% { opacity: 1; transform: translateY(0);} }
          </style>
        `;
        document.body.appendChild(logoutOverlay);
        
        setTimeout(async () => {
          try {
            await User.logout();
          } catch (error) {
            console.error("Processo de logout concluído (com possível erro de comunicação, mas forçando redirecionamento)");
            // Redirecionar para página personalizada mesmo com erro
            window.location.href = window.location.origin + "/logout-success";
          }
          window.location.href = window.location.origin + "/logout-success"; // Always redirect after delay
        }, 3000);
        
      } catch (error) {
        console.error("Erro no processo de logout:", error);
        alert("Erro ao sair do sistema. Sua sessão será encerrada de qualquer forma.");
        // Forçar limpeza local e redirecionamento
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          console.error("Erro ao limpar armazenamento local/sessão:", e);
        }
        window.location.href = window.location.origin + "/logout-success";
      }
    }
  };

  // Se for página pública, não renderizar o layout principal
  if (['AcceptInvite'].includes(currentPageName)) {
    return <>{children}</>;
  }

  if (isLoadingUser) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center px-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-white shadow">
            {/* Replaced img tag with BrandLogo component */}
            <BrandLogo className="h-10 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{BRAND.name}</h1>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Inicializando sistema...</p>
          <p className="text-sm text-gray-500 mt-2">Carregando seu ambiente personalizado</p>
        </div>
      </div>
    );
  }

  // ✅ BLOQUEIO APENAS SE:
  // - Não tem assinatura ativa E
  // - NÃO é um TeamMember ativo
  if (!isSubscriptionActive) {
    // Se é um TeamMember inativo, mostrar mensagem específica
    if (user?.is_team_member && user?.member_status !== 'ativo') {
      return (
        <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-xl shadow-2xl p-8 text-center border-t-4 border-orange-500">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Conta Temporariamente Inativa</h2>
              <div className="bg-orange-50 rounded-lg p-4 mb-6">
                <p className="text-orange-800 mb-2">
                  <strong>Atenção:</strong> Sua conta no FaciliGestor360 foi temporariamente desativada.
                </p>
                <p className="text-orange-700 text-sm">
                  Entre em contato com o administrador da sua empresa para reativar seu acesso.
                </p>
              </div>
              <Button
                onClick={handleLogout}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair do Sistema
              </Button>
              <p className="text-xs text-gray-500 mt-4">
                © 2025 {BRAND.name} - Sistema de Gestão de Facilities
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    // Caso contrário, mostrar tela de seleção de plano (apenas para admins sem plano)
    return <AccessBlocked user={user} onSubscriptionUpdate={handleSubscriptionUpdate} />;
  }

  // NOVO: Bloqueia caso o usuário não tenha CNPJ configurado (garantia de isolamento)
  if (user && !user.cnpj) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50 p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-2xl p-8 text-center border-t-4 border-rose-500">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">🏷️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Configuração Necessária</h2>
            <p className="text-gray-700 mb-4">
              Para garantir a segurança e o isolamento dos dados, sua conta precisa estar vinculada ao CNPJ da sua empresa.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Acesse Perfil e preencha o CNPJ para continuar usando o sistema.
            </p>
            <button
              onClick={() => window.location.href = createPageUrl("Profile")}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Ir para Perfil
            </button>
            <p className="text-xs text-gray-400 mt-4">Isolamento multi-tenant por CNPJ ativo.</p>
          </div>
        </div>
      </div>
    );
  }

  // Verificação de permissão de acesso à página
  if (!hasPageAccess(user?.department, currentPageName)) {
    return <AccessDeniedPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* CSS global para responsividade avançada */}
      <style>{`
        html { font-size: clamp(14px, 1.1vw + 9px, 16px); }
        :root { --radius: 12px; --container-max: 1440px; }

        .app-content h1 { font-size: clamp(1.6rem, 1.1rem + 2vw, 2.4rem); line-height: 1.2; }
        .app-content h2 { font-size: clamp(1.3rem, 1rem + 1.5vw, 2rem); line-height: 1.25; }
        .app-content h3 { font-size: clamp(1.1rem, 0.9rem + 1vw, 1.5rem); line-height: 1.3; }

        .app-content img, .app-content video, .app-content canvas, .app-content svg {
          max-width: 100%; height: auto; border-radius: var(--radius);
        }

        /* Números/currency: nunca quebrar linha e usar largura tabular */
        .kpi-value, .mono-number { white-space: nowrap; font-variant-numeric: tabular-nums; letter-spacing: 0; }
        .nowrap { white-space: nowrap; }

        /* Tabelas */
        .app-content table { width: 100%; table-layout: auto; border-collapse: separate; border-spacing: 0; }
        .app-content th, .app-content td { vertical-align: middle; white-space: nowrap; }
        .app-content th { font-weight: 600; color: #4b5563; }
        .app-content .badge { white-space: nowrap; }
        .app-content td .cell-wrap { white-space: normal; overflow-wrap: break-word; word-break: normal; }

        .app-shell { padding-inline: clamp(8px, 2vw, 24px); }

        /* Evitar quebras agressivas globais (remove 'anywhere') */
        .app-content { word-break: normal; overflow-wrap: break-word; hyphens: manual; }

        .app-content .overflow-x-auto, .app-content .overflow-auto { -webkit-overflow-scrolling: touch; }

        @media (max-width: 640px) {
          .app-content p, .app-content li, .app-content td, .app-content th { font-size: 0.97rem; }
        }

        .app-content .rounded, .app-content .rounded-md, .app-content .rounded-lg, .app-content .rounded-xl {
          border-radius: var(--radius);
        }

        @media print { .app-content { padding: 0 !important; } }
      `}</style>

      {/* Sidebar Mobile/Desktop */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 sm:w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-blue-600 to-indigo-700">
            <div className="flex items-center space-x-3">
              {/* Replaced img tag with BrandLogo component */}
              <BrandLogo className="h-8 sm:h-9 w-auto bg-white/0" />
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-white">{BRAND.name}</h1>
                <p className="text-xs text-blue-200 font-medium">Gestão completa</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white hover:bg-white hover:bg-opacity-20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              if (item.type === "link") {
                const isActive = location.pathname === item.url;
                return (
                  <Link
                    key={item.title}
                    to={item.url}
                    className={`flex items-center space-x-3 px-3 sm:px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-blue-50 text-blue-700 shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </Link>
                );
              }

              // Grupos (menus com subitens)
              const isMenuOpen = openMenu === item.title;
              const isCategoryActive =
                item.subItems && item.subItems.some((sub) => sub.url === location.pathname);

              return (
                <div key={item.title} className="pt-1">
                  <button
                    onClick={() => setOpenMenu(isMenuOpen ? null : item.title)}
                    className={`flex items-center justify-between w-full space-x-3 px-3 sm:px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                      isCategoryActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${isMenuOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isMenuOpen && (
                    <div className="pl-3 sm:pl-4 pt-1 pb-2 space-y-1">
                      {item.subItems.map((sub) => {
                        const isActive = location.pathname === sub.url;
                        return (
                          <Link
                            key={sub.title}
                            to={sub.url}
                            className={`flex items-center space-x-3 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                              isActive ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                            }`}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <sub.icon className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{sub.title}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* User Profile com branding personalizado */}
          <div className="p-3 sm:p-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-3 h-auto hover:bg-white hover:bg-opacity-50">
                  <div className="flex items-center space-x-3 w-full min-w-0">
                    <Avatar className="w-8 h-8 flex-shrink-0 ring-2 ring-blue-200">
                      <AvatarImage src={user?.photo_url} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                        {user?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.full_name || 'Usuário'}
                      </p>
                      <p className="text-xs text-blue-600 capitalize truncate font-medium">
                        {user?.department === 'admin' ? '👑 Administrador' : 
                         user?.department === 'gestor' ? '🎯 Gestor' :
                         user?.department === 'financeiro' ? '💰 Financeiro' :
                         user?.department === 'rh' ? '👥 RH' : '👀 Visualização'}
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem onClick={() => navigate(createPageUrl("Profile"))}>
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações da Conta
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair do {BRAND.name}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Header personalizado */}
        <header className="bg-white shadow-sm border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden flex-shrink-0"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent truncate">
                  {currentPageName === "Recognitions" ? "Reconhecimentos e Recados" :
                   currentPageName === "Dashboard" ? "Dashboard" :
                   currentPageName === "CRM" ? "CRM - Gestão de Relacionamento" :
                   currentPageName === "Contracts" ? "Contratos" :
                   currentPageName === "ReajusteContratual" ? "Reajustes Contratuais" :
                   currentPageName === "Measurements" ? "Medições" :
                   currentPageName === "Oficios" ? "Ofícios e Comunicados" :
                   currentPageName === "OS" ? "Ordens de Serviço" :
                   currentPageName === "Employees" ? "Funcionários" :
                   currentPageName === "Uniforms" ? "Gestão de Uniformes" :
                   currentPageName === "Patrimony" ? "Gestão Patrimonial" :
                   currentPageName === "SegurosLaudos" ? "Seguros e Laudos" :
                   currentPageName === "Financial" ? "Financeiro" :
                   currentPageName === "AllowanceReceipts" ? "Recibos de VA/VT" :
                   currentPageName === "AccountsReceivable" ? "Contas a Receber" :
                   currentPageName === "Reports" ? "Relatórios" :
                   currentPageName === "Supplies" ? "Gestão de Compras e Recibos" :
                   currentPageName === "IndirectCosts" ? "Custos Indiretos" :
                   currentPageName === "Marketplace" ? "Marketplace de Serviços" :
                   currentPageName === "Alerts" ? "Central de Alertas" :
                   currentPageName === "Marketing" ? "Marketing" :
                   currentPageName === "Support" ? "Suporte" :
                   currentPageName === "Profile" ? "Perfil" : currentPageName}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                  {currentPageName === "CRM" ? "Gerencie leads, negócios e relacionamento com clientes" :
                   currentPageName === "Recognitions" ? "Celebre conquistas e comunique-se com a equipe" :
                   currentPageName === "AllowanceReceipts" ? "Gere e gerencie recibos de vale alimentação e transporte" :
                   currentPageName === "Oficios" ? "Gerencie ofícios e comunicados importantes" :
                   currentPageName === "OS" ? "Abra, acompanhe e encerre Ordens de Serviço por contrato e unidade" :
                   currentPageName === "Patrimony" ? "Gerencie o patrimônio da sua empresa" :
                   currentPageName === "SegurosLaudos" ? "Gerencie seguros e laudos de segurança" :
                   currentPageName === "Employees" ? "Gerencie os dados e informações dos funcionários" :
                   currentPageName === "Uniforms" ? "Controle a distribuição e estoque de uniformes" :
                   currentPageName === "Financial" ? "Gerencie todas as transações financeiras" :
                   currentPageName === "AccountsReceivable" ? "Monitore e gerencie suas contas a receber" :
                   currentPageName === "IndirectCosts" ? "Controle e analise seus custos indiretos" :
                   currentPageName === "Supplies" ? "Gerencie compras e recibos; importe itens de Nota Fiscal com um clique" :
                   currentPageName === "Marketplace" ? "Descubra serviços e produtos para sua gestão" :
                   currentPageName === "Alerts" ? "Gerencie e receba notificações importantes e alertas do sistema" :
                   currentPageName === "Marketing" ? "Crie e gerencie campanhas de marketing" :
                   currentPageName === "Support" ? "Acesse a base de conhecimento e entre em contato com o suporte" :
                   currentPageName === "Reports" ? "Acesse relatórios e análises de desempenho" :
                   currentPageName === "ReajusteContratual" ? "Gerencie e aplique reajustes aos contratos" :
                   currentPageName === "Measurements" ? "Acompanhe e registre as medições dos serviços" :
                   "Gerencie seus contratos de facilities com eficiência"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full text-xs"></span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="app-shell">
            <div className="app-content max-w-screen-2xl mx-auto min-h-full">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

