import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "./App.css";
import { HomePage } from "./pages/Home/HomePage";
import { LoginPage } from "./pages/Login/LoginPage";
import { ForgotPasswordPage } from "./pages/Login/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/Login/ResetPasswordPage";
import { FeedPage } from "./pages/Feed/FeedPage";
import { ProfilePage } from "./pages/Profile/ProfilePage";
import { EventPage } from "./pages/Event/EventPage";
import ProtectedRoute from "./components/ProtectedRoute"
import { MapPage } from "./pages/Map/MapPage";
import CalanderPage from "./pages/Calander/CalanderPage";


// docs: https://reactrouter.com/en/main/start/overview
const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/reset-password",
    element: <ResetPasswordPage />,
  },
  {
    path: "/feed",
    element: <FeedPage />,
  },
  {
    path: "/events/:id",
    element: <EventPage />
  },
  {
    path: "/profile",
    element:
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
  },
  {
    path: "/explore",
    element:
      <MapPage />
  },
  {
    path: "/calendar",
    element:
      <CalanderPage />
  }

]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;