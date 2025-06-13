import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useState, ReactNode } from 'react';
import NavBar from './components/NavBar';
import PrivateRoute from './components/PrivateRoute';
import HubDoctor from './pages/HubDoctor';
import HubAdmin from './pages/HubAdmin';
import HubPatient from './pages/HubPatient';
import Create from './pages/Create';
import Login from './pages/Login';
import PatientDetail from './pages/PatientDetail';
import NotFound from './pages/NotFound';
import Register from './pages/Register';
import PdfViewer from './pages/PdfViewer';
import Divided from './pages/Divided';

interface User {
  role: 'Administrator' | 'Doctor' | 'Patient' | string;
  [key: string]: any;
}

interface PrivateRouteProps {
  logged: boolean;
  currentUser: User | null;
  allowedRoles: string[];
  children: ReactNode;
}

function App() {
  const [logged, setLogged] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  console.log("App chargé")

  return (
      <div className="min-h-screen bg-gray-50">
        <NavBar logged={logged} setLogged={setLogged} />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route
              path="/"
              element={
                <Navigate
                  to={
                    currentUser?.role === 'Administrator'
                      ? '/hub/admin'
                    : currentUser?.role === 'Doctor'
                      ? '/hub/medecin'
                    : currentUser?.role === 'Patient'
                      ? '/hub/patient'
                    : '/login'
                  }
                />
              }
            />

            <Route
              path="/hub/admin"
              element={
                <PrivateRoute
                  logged={logged}
                  currentUser={currentUser}
                  allowedRoles={['Administrator']}
                >
                  <HubAdmin />
                </PrivateRoute>
              }
            />

            <Route
              path="/hub/medecin"
              element={
                <PrivateRoute
                  logged={logged}
                  currentUser={currentUser}
                  allowedRoles={['Doctor']}
                >
                  <HubDoctor />
                </PrivateRoute>
              }
            />

            <Route
              path="/hub/patient"
              element={
                <PrivateRoute
                  logged={logged}
                  currentUser={currentUser}
                  allowedRoles={['Patient']}
                >
                  <HubPatient />
                </PrivateRoute>
              }
            />

            <Route path="/create" element={<Create />} />
            <Route
              path="/login"
              element={<Login setLogged={setLogged} setCurrentUser={setCurrentUser} />}
            />
            <Route path="/patient/:id" element={<PatientDetail />} />
            <Route path="/patient/:id/pdf/:pdfId" element={<PdfViewer />} />
            <Route path="/patient/:id/divide/:pdfId" element={<Divided />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
  );
}

export default App;
