import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Loading from './components/Loading';
import RequireSession from './components/RequireSession';
import { ROLES } from './constants/roles';
import './App.css';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const CompleteProfile = lazy(() => import('./pages/CompleteProfile'));
const Home = lazy(() => import('./pages/Home'));
const Services = lazy(() => import('./pages/Services'));
const ServiceResults = lazy(() => import('./pages/ServiceResults'));
const Book = lazy(() => import('./pages/Book'));
const Appointments = lazy(() => import('./pages/Appointments'));
const Messenger = lazy(() => import('./pages/Messenger'));
const Profile = lazy(() => import('./pages/Profile'));

function signedIn(page, role) {
  return <RequireSession role={role}>{page}</RequireSession>;
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/home" element={signedIn(<Home />)} />
        <Route path="/services" element={signedIn(<Services />, ROLES.CLIENT)} />
        <Route path="/services/results" element={signedIn(<ServiceResults />, ROLES.CLIENT)} />
        <Route path="/book/:serviceId" element={signedIn(<Book />, ROLES.CLIENT)} />
        <Route path="/appointments" element={signedIn(<Appointments />)} />
        <Route path="/messages" element={signedIn(<Messenger />)} />
        <Route path="/profile" element={signedIn(<Profile />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
