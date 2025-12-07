import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Button, ConfigProvider, Layout, theme as antdTheme } from "antd";
import { Provider, useDispatch, useSelector } from "react-redux";

import { store } from "./redux/store";
import SidebarMenu from "./pages/components/SidebarMenu";
import Navbar from "./pages/components/Navbar";
import Print from "./pages/printMaterial/Print";
import LoginPage from "./pages/authRoute/LoginPage";
import { roleRoutes } from "./routes/roleBaseRoutes";
import ProtectedRoute from "./pages/components/ProtectedRoutes";
import toast, { Toaster } from "react-hot-toast";
import NotFoundPage from "./pages/NotFoundPage";
import { leaveImpersonationApi } from "./services/apis";
import { removeUser, setUser } from "./redux/userSlice";
import { removeHospital } from "./redux/hospitalSlice";

const { Content } = Layout;

function AppContent() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const user = useSelector((state) => state.user);
  const modules = useSelector((state) => state.hospital?.modules);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      dispatch(removeUser());
      dispatch(removeHospital());
      navigate("/login");
    }
  }, []);

  const leaveImpersonation = async () => {
    try {
      const res = await leaveImpersonationApi();
      if (res.success) {
        const { token } = res;
        sessionStorage.setItem("token", token);
        dispatch(setUser(res.user));
        dispatch(removeHospital());
        toast.success(res.message || "Exited impersonation");
        navigate("/dashboard");
      } else {
        toast.error(res.message || "Failed to leave impersonation");
      }
    } catch (error) {
      toast.error(error.message || "Server error while leaving impersonation");
    }
  };

  const isLoginPage = location.pathname === "/login";
  if (isLoginPage) return <LoginPage />;

  const accessibleRoutes = roleRoutes[user?.role] || [];
  let allowedRoutes;
  if (user?.role !== "superAdmin") {
    allowedRoutes = accessibleRoutes?.filter((route) => {
      const routePath = route?.path?.toLowerCase();
      const matchedModule = Object?.keys(modules)?.find((moduleName) =>
        routePath?.includes(moduleName)
      );
      if (matchedModule && modules[matchedModule] === false) {
        return false;
      }
      return true;
    });
  } else {
    allowedRoutes = accessibleRoutes;
  }

  if (!user?._id) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <SidebarMenu
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        user={user}
      />
      <Layout
        className={`transition-all duration-200 ${
          collapsed ? "ml-[80px]" : "ml-[200px]"
        } print:ml-0 print:w-full`}
      >
        {user?.impersonatedBy && (
          <div className="bg-yellow-100 border-b border-yellow-300 px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
            <span className="text-yellow-800 font-medium text-sm sm:text-base">
              👤 Impersonating: <strong>{user.fullName}</strong>
            </span>
            <Button
              danger
              size="small"
              className="self-end sm:self-auto"
              onClick={() => leaveImpersonation()}
            >
              Leave
            </Button>
          </div>
        )}
        <Navbar />
        <Content className="p-6 overflow-y-auto print:overflow-visible print:p-0">
          <Routes>
            {allowedRoutes.map(({ path, element }) => (
              <Route
                key={path}
                path={path}
                element={<ProtectedRoute>{element}</ProtectedRoute>}
              />
            ))}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default function App() {
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light")
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
    window.theme = theme;
  }, [theme]);

  window.setTheme = setTheme;

  return (
    <Provider store={store}>
      <ConfigProvider
        theme={{
          algorithm:
            theme === "dark"
              ? antdTheme.darkAlgorithm
              : antdTheme.defaultAlgorithm,
        }}
      >
        <Router>
          <Toaster
            position="top-center"
            reverseOrder={false}
            toastOptions={{ duration: 6000 }}
          />
          <Routes>
            <Route path="/print" element={<Print />} />
            <Route path="/*" element={<AppContent />} />
          </Routes>
        </Router>
      </ConfigProvider>
    </Provider>
  );
}
