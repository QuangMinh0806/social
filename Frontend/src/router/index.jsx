import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";
import { ProtectedRoute, PublicRoute, AdminRoute } from "../components/common/ProtectedRoute";

// Pages
import DashboardPage from "../pages/dashboard/DashboardPage";
import PostListPage from "../pages/posts/PostListPage";
import PostCreatePage from "../pages/posts/PostCreatePage";
import PostEditPage from "../pages/posts/PostEditPage";
import PostDetailPage from "../pages/posts/PostDetailPage";
import PageListPage from "../pages/pages/PageListPage";
import CalendarPage from "../pages/calendar/CalendarPage";
import AnalyticsPage from "../pages/analytics/AnalyticsPage";
import AIAssistantPage from "../pages/ai/AIAssistantPage";
import TemplateListPageNew from "../pages/templates/TemplateListPageNew";
import TemplateCreatePageNew from "../pages/templates/TemplateCreatePageNew";
import TemplateEditPage from "../pages/templates/TemplateEditPage";
import MediaLibraryPage from "../pages/media/MediaLibraryPage";
import EmployeeListPage from "../pages/employees/EmployeeListPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import NotFoundPage from "../pages/NotFoundPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import UserManagementPage from "../pages/users/UserManagementPage";
import YoutubeCallback from "../pages/YoutubeCallback";
import Config from "../pages/config/Config";

import { ROUTES } from "../config/constants";

const router = createBrowserRouter([
    // Auth routes (public)
    {
        path: "/login",
        element: (
            <PublicRoute>
                <LoginPage />
            </PublicRoute>
        ),
    },
    {
        path: "/register",
        element: (
            <PublicRoute>
                <RegisterPage />
            </PublicRoute>
        ),
    },
    {
        path: "/unauthorized",
        element: <UnauthorizedPage />,
    },

    // Protected routes
    {
        path: "/",
        element: (
            <ProtectedRoute>
                <MainLayout />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <DashboardPage /> },
            { path: ROUTES.DASHBOARD, element: <DashboardPage /> },

            // Posts routes
            { path: ROUTES.POSTS, element: <PostListPage /> },
            { path: ROUTES.POST_CREATE, element: <PostCreatePage /> },
            { path: "/posts/:id", element: <PostDetailPage /> },
            { path: "/posts/:id/edit", element: <PostEditPage /> },

            // Calendar
            { path: ROUTES.CALENDAR, element: <CalendarPage /> },

            // Pages
            { path: ROUTES.PAGES, element: <PageListPage /> },

            // User Management (Admin only)
            {
                path: "/users",
                element: (
                    <AdminRoute>
                        <UserManagementPage />
                    </AdminRoute>
                )
            },

            // Employees
            { path: ROUTES.EMPLOYEES, element: <EmployeeListPage /> },

            // Templates
            { path: "/templates", element: <TemplateListPageNew /> },
            { path: "/templates/create", element: <TemplateCreatePageNew /> },
            { path: "/templates/:id/edit", element: <TemplateEditPage /> },

            // Media
            { path: "/media", element: <MediaLibraryPage /> },

            // Analytics
            { path: ROUTES.ANALYTICS, element: <AnalyticsPage /> },

            // AI Assistant
            { path: ROUTES.AI_ASSISTANT, element: <AIAssistantPage /> },

            // Config
            { path: ROUTES.CONFIG, element: <Config /> },

            // Youtube callback
            { path: "/youtube/callback", element: <YoutubeCallback /> },
        ],
    },
    {
        path: "*",
        element: <NotFoundPage />,
    },
]);

export default router;
