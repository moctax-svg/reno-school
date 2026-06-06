import React, { useState } from 'react';
import RoleSelector from './components/RoleSelector';
import LoginScreen from './components/LoginScreen';
import AdminApp from './pages/admin/AdminApp';
import TeacherApp from './pages/teacher/TeacherApp';
import StudentApp from './pages/student/StudentApp';
import ParentApp from './pages/parent/ParentApp';
import SecurityApp from './pages/security/SecurityApp';
import SupervisorApp from './pages/supervisor/SupervisorApp';
import AccountantApp from './pages/accountant/AccountantApp';

export default function App() {
  const [selectedRole, setSelectedRole] = useState(null);   // role selected on welcome screen
  const [loggedInUser, setLoggedInUser] = useState(null);   // after login form

  function handleRoleSelect(role) {
    setSelectedRole(role);
  }

  function handleLoginSuccess(user) {
    setLoggedInUser(user);
  }

  function handleLogout() {
    setSelectedRole(null);
    setLoggedInUser(null);
  }

  function handleBackToRoles() {
    setSelectedRole(null);
    setLoggedInUser(null);
  }

  // Step 1: No role selected → show role selector
  if (!selectedRole) {
    return <RoleSelector onSelect={handleRoleSelect} />;
  }

  // Step 2: Role selected but not logged in → show login screen
  if (!loggedInUser) {
    return (
      <LoginScreen
        role={selectedRole}
        onSuccess={handleLoginSuccess}
        onBack={handleBackToRoles}
      />
    );
  }

  // Step 3: Logged in → show role-specific app
  const props = { onLogout: handleLogout, role: loggedInUser, user: loggedInUser };

  switch (loggedInUser.id) {
    case 'admin':       return <AdminApp {...props} />;
    case 'teacher':     return <TeacherApp {...props} />;
    case 'student':     return <StudentApp {...props} />;
    case 'parent':      return <ParentApp {...props} />;
    case 'security':    return <SecurityApp {...props} />;
    case 'supervisor':  return <SupervisorApp {...props} />;
    case 'accountant':  return <AccountantApp {...props} />;
    default:            return <RoleSelector onSelect={handleRoleSelect} />;
  }
}
