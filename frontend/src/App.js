import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import Sidebar from './components/common/Sidebar';
import SidebarToggle from './components/common/SidebarToggle';
import CreateTicketPage from './pages/CreateTicketPage';
import AnalyticsPage from './pages/AnalyticsPage';
import TicketDetailPage from './pages/TicketDetailPage';
import ReportsPage from './pages/ReportsPage';

// Management Pages
import CategoriesPage from './pages/CategoriesPage';
import TypesPage from './pages/TypesPage';
import DepartmentsPage from './pages/DepartmentsPage';
import PriorityRulesPage from './pages/PriorityRulesPage';
import SLARulesPage from './pages/SLARulesPage';

//users page
import UsersPage from './pages/UsersPage';
import RolesPage from './pages/RolesPage';

//Reports page
import ReportsDailyPage from './pages/ReportsDailyPage';
import ReportsWeeklyPage from './pages/ReportsWeeklyPage';
import ReportsSLAPage from './pages/ReportsSLAPage';
import ReportsWorkloadPage from './pages/ReportsWorkloadPage';

// Protected Route component
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    return children;
};

// Layout with Sidebar
const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div>
            <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
            <SidebarToggle toggleSidebar={toggleSidebar} />
            <div
                style={{
                    marginLeft: sidebarOpen ? '280px' : '0',
                    transition: 'margin-left 0.3s ease',
                    padding: '20px',
                    minHeight: '100vh',
                    backgroundColor: '#f3f4f6',
                }}
            >
                {children}
            </div>
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Auth Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    {/* Protected Routes */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <DashboardPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                                        <Route
                        path="/analytics"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <AnalyticsPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                                        <Route
                        path="/tickets/:id"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <TicketDetailPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/create-ticket"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <CreateTicketPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                    {/* Management Routes */}
                    <Route
                        path="/categories"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <CategoriesPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/types"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <TypesPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/departments"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <DepartmentsPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/priority-rules"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <PriorityRulesPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/sla-rules"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <SLARulesPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                   
                    // Inside Routes:
                    <Route
                        path="/users"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <UsersPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/roles"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <RolesPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                                <Route
                        path="/reports/daily"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <ReportsDailyPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/reports/weekly"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <ReportsWeeklyPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                                        
                                        <Route
                        path="/reports"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <ReportsPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/reports/sla"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <ReportsSLAPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/reports/workload"
                        element={
                            <ProtectedRoute>
                                <Layout>
                                    <ReportsWorkloadPage />
                                </Layout>
                            </ProtectedRoute>
                        }
                    />

                    {/* Default Route */}
                    <Route path="/" element={<Navigate to="/dashboard" />} />

                    {/* 404 Catch-all */}
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;