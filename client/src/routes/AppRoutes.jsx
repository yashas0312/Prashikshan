import { Navigate, Route, Routes } from 'react-router-dom';
import { AssessmentGuard, PartnerSetupGuard, ProtectedRoute, PublicRoute } from '../components/Guards';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Assessment from '../pages/Assessment';
import Courses from '../pages/Courses';
import Internships from '../pages/Internships';
import PartnerDashboard from '../pages/PartnerDashboard';
import CoordinatorDashboard from '../pages/CoordinatorDashboard';
import CoordinatorSetup from '../pages/CoordinatorSetup';
import PartnerProfileSetup from '../pages/PartnerProfileSetup';
import NotFound from '../pages/NotFound';
import VerifyCertificate from '../pages/VerifyCertificate';
import IndustryAwareness from '../pages/IndustryAwareness';

export default function AppRoutes() {
  return <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
    <Route path="/coordinator-setup" element={<PublicRoute><CoordinatorSetup /></PublicRoute>} />
    <Route path="/partner-setup" element={<PartnerSetupGuard><PartnerProfileSetup /></PartnerSetupGuard>} />
    <Route path="/courses" element={<AssessmentGuard><Courses /></AssessmentGuard>} />
    <Route path="/internships" element={<AssessmentGuard><Internships /></AssessmentGuard>} />
    <Route path="/dashboard" element={<ProtectedRoute roles={['student']}><Dashboard /></ProtectedRoute>} />
    <Route path="/assessment" element={<ProtectedRoute roles={['student']}><Assessment /></ProtectedRoute>} />
    <Route path="/industry-awareness" element={<ProtectedRoute roles={['student']}><IndustryAwareness /></ProtectedRoute>} />
    <Route path="/skill-assessment" element={<Navigate to="/assessment" replace />} />
    <Route path="/partner" element={<ProtectedRoute roles={['partner']}><PartnerDashboard /></ProtectedRoute>} />
    <Route path="/coordination" element={<ProtectedRoute roles={['coordinator']}><CoordinatorDashboard /></ProtectedRoute>} />
    {/* Public certificate verification — no auth required */}
    <Route path="/verify/:certificateId" element={<VerifyCertificate />} />
    <Route path="*" element={<NotFound />} />
  </Routes>;
}
