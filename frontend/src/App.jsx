import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "./App.css";
import { HomePage } from "./pages/Home/HomePage";
import { LoginPage } from "./pages/Login/LoginPage";
import { FeedPage } from "./pages/Feed/FeedPage";
import { ProfilePage } from "./pages/Profile/ProfilePage";
import { EventPage } from "./pages/Event/EventPage";
import ProtectedRoute from "./components/ProtectedRoute"


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
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
