import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";

// Pages
import DashboardPage from "../pages/dashboard/DashboardPage";
import PostListPage from "../pages/posts/PostListPage";
import PostCreatePage from "../pages/posts/PostCreatePage";
import PostEditPage from "../pages/posts/PostEditPage";
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
import NotFoundPage from "../pages/NotFoundPage";
import YoutubeCallback from "../pages/YoutubeCallback";

import { ROUTES } from "../config/constants";

const router = createBrowserRouter([
    {
        path: "/",
        element: <MainLayout />,
        children: [
            { index: true, element: <DashboardPage /> },
            { path: ROUTES.DASHBOARD, element: <DashboardPage /> },

            // Posts routes
            { path: ROUTES.POSTS, element: <PostListPage /> },
            { path: ROUTES.POST_CREATE, element: <PostCreatePage /> },
            { path: "/posts/:id/edit", element: <PostEditPage /> },

            // Calendar
            { path: ROUTES.CALENDAR, element: <CalendarPage /> },

            // Pages
            { path: ROUTES.PAGES, element: <PageListPage /> },

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
        ],
    },
    {
        path: "/youtube/callback",
        element: <YoutubeCallback />,
    },
    {
        path: "/",
        element: <AuthLayout />,
        children: [{ path: ROUTES.LOGIN, element: <LoginPage /> }],
    },
    {
        path: "*",
        element: <NotFoundPage />,
    },
]);

export default router;
