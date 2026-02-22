import { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import LogHours from './pages/LogHours';
import LogExpense from './pages/LogExpense';
import MyPayments from './pages/MyPayments';
import EmployeesList from './pages/EmployeesList';
import AddEmployee from './pages/AddEmployee';
import ProjectDetail from './pages/ProjectDetail';
import PayEmployee from './pages/PayEmployee';
import AddProject from './pages/AddProject';

function App() {
    const { user } = useContext(AuthContext);

    if (!user) {
        return (
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }

    return (
        <div className="app-layout">
            <Navbar />
            <main className="container">
                <Routes>
                    {/* Employee Routes */}
                    <Route path="/" element={user.is_manager ? <Navigate to="/manager" replace /> : <EmployeeDashboard />} />
                    <Route path="/log-hours" element={<LogHours />} />
                    <Route path="/log-expense" element={<LogExpense />} />
                    <Route path="/my-payments" element={<MyPayments />} />

                    {/* Manager Routes */}
                    {user.is_manager && (
                        <>
                            <Route path="/manager" element={<ManagerDashboard />} />
                            <Route path="/projects/add" element={<AddProject />} />
                            <Route path="/project/:id" element={<ProjectDetail />} />
                            <Route path="/employees" element={<EmployeesList />} />
                            <Route path="/employees/add" element={<AddEmployee />} />
                            <Route path="/employees/edit/:phone" element={<AddEmployee />} />
                            <Route path="/pay-employee/:phone" element={<PayEmployee />} />
                        </>
                    )}

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;
