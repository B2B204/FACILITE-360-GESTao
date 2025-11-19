import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Contracts from "./Contracts";

import Employees from "./Employees";

import Financial from "./Financial";

import Reports from "./Reports";

import Profile from "./Profile";

import Supplies from "./Supplies";

import IndirectCosts from "./IndirectCosts";

import Measurements from "./Measurements";

import Marketplace from "./Marketplace";

import Uniforms from "./Uniforms";

import Patrimony from "./Patrimony";

import AccessDeniedPage from "./AccessDeniedPage";

import HomePage from "./HomePage";

import AccountsReceivable from "./AccountsReceivable";

import AcceptInvite from "./AcceptInvite";

import ReajusteContratual from "./ReajusteContratual";

import SegurosLaudos from "./SegurosLaudos";

import Oficios from "./Oficios";

import Recognitions from "./Recognitions";

import AllowanceReceipts from "./AllowanceReceipts";

import CRM from "./CRM";

import LogoutSuccess from "./LogoutSuccess";

import Alerts from "./Alerts";

import Marketing from "./Marketing";

import Support from "./Support";

import OS from "./OS";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Contracts: Contracts,
    
    Employees: Employees,
    
    Financial: Financial,
    
    Reports: Reports,
    
    Profile: Profile,
    
    Supplies: Supplies,
    
    IndirectCosts: IndirectCosts,
    
    Measurements: Measurements,
    
    Marketplace: Marketplace,
    
    Uniforms: Uniforms,
    
    Patrimony: Patrimony,
    
    AccessDeniedPage: AccessDeniedPage,
    
    HomePage: HomePage,
    
    AccountsReceivable: AccountsReceivable,
    
    AcceptInvite: AcceptInvite,
    
    ReajusteContratual: ReajusteContratual,
    
    SegurosLaudos: SegurosLaudos,
    
    Oficios: Oficios,
    
    Recognitions: Recognitions,
    
    AllowanceReceipts: AllowanceReceipts,
    
    CRM: CRM,
    
    LogoutSuccess: LogoutSuccess,
    
    Alerts: Alerts,
    
    Marketing: Marketing,
    
    Support: Support,
    
    OS: OS,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Contracts" element={<Contracts />} />
                
                <Route path="/Employees" element={<Employees />} />
                
                <Route path="/Financial" element={<Financial />} />
                
                <Route path="/Reports" element={<Reports />} />
                
                <Route path="/Profile" element={<Profile />} />
                
                <Route path="/Supplies" element={<Supplies />} />
                
                <Route path="/IndirectCosts" element={<IndirectCosts />} />
                
                <Route path="/Measurements" element={<Measurements />} />
                
                <Route path="/Marketplace" element={<Marketplace />} />
                
                <Route path="/Uniforms" element={<Uniforms />} />
                
                <Route path="/Patrimony" element={<Patrimony />} />
                
                <Route path="/AccessDeniedPage" element={<AccessDeniedPage />} />
                
                <Route path="/HomePage" element={<HomePage />} />
                
                <Route path="/AccountsReceivable" element={<AccountsReceivable />} />
                
                <Route path="/AcceptInvite" element={<AcceptInvite />} />
                
                <Route path="/ReajusteContratual" element={<ReajusteContratual />} />
                
                <Route path="/SegurosLaudos" element={<SegurosLaudos />} />
                
                <Route path="/Oficios" element={<Oficios />} />
                
                <Route path="/Recognitions" element={<Recognitions />} />
                
                <Route path="/AllowanceReceipts" element={<AllowanceReceipts />} />
                
                <Route path="/CRM" element={<CRM />} />
                
                <Route path="/LogoutSuccess" element={<LogoutSuccess />} />
                
                <Route path="/Alerts" element={<Alerts />} />
                
                <Route path="/Marketing" element={<Marketing />} />
                
                <Route path="/Support" element={<Support />} />
                
                <Route path="/OS" element={<OS />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}