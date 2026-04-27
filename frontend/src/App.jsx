import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import CourtsPage from "./pages/CourtsPage";
import ReservationsPage from "./pages/ReservationsPage";
import MyReservationsPage from "./pages/MyReservationsPage";
import LessonsPage from "./pages/LessonsPage";
import MatchesPage from "./pages/MatchesPage";
import AdminPage from "./pages/AdminPage";
import SettingsPage from "./pages/SettingsPage";
import { ThemeProvider } from "./context/ThemeContext";

const App = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="courts" element={<CourtsPage />} />
            <Route path="reservations" element={<ReservationsPage />} />
            <Route path="my-reservations" element={<MyReservationsPage />} />
            <Route path="lessons" element={<LessonsPage />} />
            <Route path="matches" element={<MatchesPage />} />
            <Route path="settings" element={<SettingsPage />} />

            <Route
              path="admin"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
