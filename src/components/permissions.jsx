
export const PERMISSIONS = {
  admin: {
    pages: ['all'],
    actions: ['all'],
  },
  gestor: {
    pages: ['Dashboard', 'Contracts', 'ReajusteContratual', 'Measurements', 'Reports', 'Supplies', 'Marketplace', 'Profile', 'Patrimony', 'SegurosLaudos', 'Oficios', 'Recognitions', 'CRM', 'Alerts', 'Marketing', 'Support'],
    actions: ['create', 'edit', 'view', 'manage_seguros_laudos', 'crm_all'],
  },
  rh: {
    pages: ['Dashboard', 'Employees', 'Uniforms', 'Reports', 'Profile', 'Recognitions', 'AllowanceReceipts', 'Support'],
    actions: ['create', 'edit', 'delete', 'view'],
  },
  financeiro: {
    pages: ['Dashboard', 'Financial', 'IndirectCosts', 'Reports', 'Profile', 'AccountsReceivable', 'AllowanceReceipts', 'Recognitions', 'Alerts', 'Support'],
    actions: ['create', 'edit', 'view'],
  },
  comercial: {
    pages: ['Dashboard', 'CRM', 'Reports', 'Profile', 'Recognitions', 'Marketing', 'Alerts'],
    actions: ['create', 'edit', 'view', 'crm_own'],
  },
  operador: {
    pages: ['all'],
    actions: ['view'],
  },
};

export const hasPageAccess = (role, pageName) => {
  const userRole = role || 'operador';
  const permissions = PERMISSIONS[userRole];
  if (!permissions) return false;
  if (permissions.pages.includes('all')) return true;
  const systemPages = ['Dashboard','Contracts','ReajusteContratual','Employees','Financial','Reports','Profile','Measurements','Uniforms','Patrimony','Supplies','IndirectCosts','Marketplace','AccessDeniedPage','SegurosLaudos','AccountsReceivable','Oficios','AllowanceReceipts','Recognitions','CRM','Alerts','Marketing','Support'];
  if (systemPages.includes(pageName)) {
    return permissions.pages.includes(pageName);
  }
  return false;
};

export const canPerformAction = (role, action) => {
  const userRole = role || 'operador';
  const permissions = PERMISSIONS[userRole];
  
  if (!permissions) {
    return false;
  }

  if (permissions.actions.includes('all')) {
    return true;
  }

  return permissions.actions.includes(action);
};

export const canManageSegurosLaudos = (role) => {
  const userRole = role || 'operador';
  return userRole === 'admin' || userRole === 'gestor';
};

export const canAccessCRM = (role) => {
  const userRole = role || 'operador';
  return ['admin', 'gestor', 'comercial'].includes(userRole);
};

export const canViewAllDeals = (role) => {
  const userRole = role || 'operador';
  return userRole === 'admin' || canPerformAction(userRole, 'crm_all');
};
