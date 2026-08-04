import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import InterviewConfig from "./pages/InterviewConfig";
import InterviewSession from "./pages/InterviewSession";
import InterviewScore from "./pages/InterviewScore";
import InterviewResult from "./pages/InterviewResult";
import Layout from "./components/layout/Layout";
import Preparation from "./pages/Preparation";
import History from "./pages/History";
import Analytics from "./pages/Analytics";
import Contest from "./pages/Contest";
import Profile from "./pages/Profile";
import Problems from "./pages/Problems";
import ProblemSolver from "./pages/ProblemSolver";
import Contribute from "./pages/Contribute";
import ContestRoom from "./pages/ContestRoom";
import ContestSchedule from "./pages/ContestSchedule";

function App() {
  const { user, loading, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-background text-text">Loading...</div>;
  }

  const wrap = (component: React.ReactElement) =>
    user ? <Layout>{component}</Layout> : <Navigate to="/login" />;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={!user ? <Landing /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/dashboard" />}
        />
        <Route path="/register" element={<Navigate to="/login" />} />
        <Route path="/dashboard" element={wrap(<Dashboard />)} />
        <Route path="/interview/new" element={wrap(<InterviewConfig />)} />
        <Route path="/interview/session" element={wrap(<InterviewSession />)} />
        <Route path="/interview/score" element={wrap(<InterviewScore />)} />
        <Route path="/interview/result/:id" element={wrap(<InterviewResult />)} />
        <Route path="/preparation" element={wrap(<Preparation />)} />
        <Route path="/history" element={wrap(<History />)} />
        <Route path="/analytics" element={wrap(<Analytics />)} />
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/contest" element={wrap(<Contest />)} />
        <Route path="/contest/schedule" element={wrap(<ContestSchedule />)} />
        <Route path="/contest/:id" element={wrap(<ContestRoom />)} />
        <Route path="/problems" element={wrap(<Problems />)} />
        <Route path="/contest-room" element={wrap(<ContestRoom />)} />
        <Route path="/contribute" element={wrap(<Contribute />)} />
        <Route path="/problems/:slug" element={wrap(<ProblemSolver />)} />
        <Route path="/profile" element={wrap(<Profile />)} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
