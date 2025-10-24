import React, { useState, useEffect } from 'react';
import { llmService } from '../../services/llm.service';
import { pageService } from '../../services/page.service';

const Config = () => {
    const [activeTab, setActiveTab] = useState('ai-api');
    const [llmConfigs, setLlmConfigs] = useState([]);
    const [socialPlatforms, setSocialPlatforms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', key: '' });

    useEffect(() => {
        if (activeTab === 'ai-api') {
            loadLLMConfigs();
        } else if (activeTab === 'social-platforms') {
            loadSocialPlatforms();
        }
    }, [activeTab]);

    const loadLLMConfigs = async () => {
        setLoading(true);
        try {
            const response = await llmService.getAll();
            if (response.success) {
                setLlmConfigs(response.data || []);
            }
        } catch (error) {
            console.error('Error loading LLM configs:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSocialPlatforms = async () => {
        setLoading(true);
        try {
            const response = await pageService.getAll();
            if (response.success) {
                setSocialPlatforms(response.data || []);
            }
        } catch (error) {
            console.error('Error loading social platforms:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({ name: item.name, key: item.key || item.access_token || '' });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (activeTab === 'ai-api') {
            try {
                if (editingItem) {
                    await llmService.update(editingItem.id, formData);
                } else {
                    await llmService.create(formData);
                }
                loadLLMConfigs();
                closeModal();
            } catch (error) {
                console.error('Error saving LLM config:', error);
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa?')) {
            try {
                if (activeTab === 'ai-api') {
                    await llmService.delete(id);
                    loadLLMConfigs();
                } else {
                    await pageService.delete(id);
                    loadSocialPlatforms();
                }
            } catch (error) {
                console.error('Error deleting:', error);
            }
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({ name: '', key: '' });
    };

    const renderTabs = () => (
        <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-gray-200 overflow-x-auto scrollbar-hide">
            <button
                className={`px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === 'ai-api'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                    }`}
                onClick={() => setActiveTab('ai-api')}
            >
                <span className="hidden sm:inline">🤖 AI & API</span>
                <span className="sm:hidden">🤖 AI</span>
            </button>
            <button
                className={`px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium transition-colors whitespace-nowrap flex-shrink-0 ${activeTab === 'social-platforms'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                    }`}
                onClick={() => setActiveTab('social-platforms')}
            >
                <span className="hidden sm:inline">🌐 Social Platforms</span>
                <span className="sm:hidden">🌐 Social</span>
            </button>
        </div>
    );

    const renderAIAPITab = () => (
        <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-800">
                    <span className="hidden sm:inline">🤖 AI Configuration</span>
                    <span className="sm:hidden">🤖 Cấu hình AI</span>
                </h2>
                <button
                    onClick={() => {
                        setEditingItem(null);
                        setFormData({ name: '', key: '' });
                        setIsModalOpen(true);
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm sm:text-base font-medium"
                >
                    + Thêm AI
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            ) : llmConfigs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <p className="text-sm sm:text-base">Chưa có cấu hình AI nào</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    {llmConfigs.map((config) => (
                        <div key={config.id} className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                    {config.name} API Key
                                </label>
                                <div className="space-y-2">
                                    <input
                                        type="password"
                                        value={config.key}
                                        readOnly
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(config)}
                                            className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                                        >
                                            <span className="hidden sm:inline">✏️ Sửa</span>
                                            <span className="sm:hidden">✏️</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(config.id)}
                                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Để trống nếu không sử dụng {config.name}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderSocialPlatformsTab = () => (
        <div>
            <div className="mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-800">
                    <span className="hidden sm:inline">🌐 Social Platforms</span>
                    <span className="sm:hidden">🌐 Nền tảng</span>
                </h2>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            ) : socialPlatforms.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <p className="text-sm sm:text-base">Chưa kết nối platform nào</p>
                </div>
            ) : (
                <div className="space-y-3 sm:space-y-4">
                    {socialPlatforms.map((platform) => (
                        <div key={platform.id} className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
                            <div className="flex flex-col gap-4">
                                {/* Platform Info */}
                                <div className="flex items-center gap-3 sm:gap-4">
                                    {platform.avatar_url && (
                                        <img
                                            src={platform.avatar_url}
                                            alt={platform.page_name}
                                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex-shrink-0 object-cover"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
                                            {platform.page_name}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                                            ID: {platform.platform_id}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2 mt-1">
                                            <p className="text-xs sm:text-sm text-gray-600">
                                                Followers: <span className="font-medium">{platform.follower_count?.toLocaleString()}</span>
                                            </p>
                                            <span className="text-gray-300">•</span>
                                            <p className="text-xs sm:text-sm">
                                                <span className={`font-medium ${platform.status === 'connected' ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    {platform.status === 'connected' ? '✓ Đã kết nối' : '✗ Ngắt kết nối'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-2 border-t border-gray-100">
                                    <a
                                        href={platform.page_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center text-sm font-medium"
                                    >
                                        <span className="hidden sm:inline">🔗 Truy cập</span>
                                        <span className="sm:hidden">🔗</span>
                                    </a>
                                    <button
                                        onClick={() => handleDelete(platform.id)}
                                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                                    >
                                        <span className="hidden sm:inline">🗑️ Xóa</span>
                                        <span className="sm:hidden">🗑️</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )
            }
        </div >
    );

    const renderModal = () => {
        if (!isModalOpen) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
                    <h3 className="text-lg sm:text-xl font-bold mb-4">
                        {editingItem ? 'Chỉnh sửa AI Config' : 'Thêm AI Config mới'}
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tên AI
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                placeholder="Ví dụ: OpenAI, Gemini"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                API Key
                            </label>
                            <input
                                type="text"
                                value={formData.key}
                                onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                                placeholder="Nhập API Key"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                        <button
                            onClick={handleSave}
                            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm sm:text-base font-medium"
                        >
                            💾 Lưu
                        </button>
                        <button
                            onClick={closeModal}
                            className="flex-1 px-4 py-2.5 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition text-sm sm:text-base font-medium"
                        >
                            ❌ Hủy
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-3 sm:p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                    <h1 className="text-xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">
                        ⚙️ Cấu hình hệ thống
                    </h1>

                    {renderTabs()}

                    {activeTab === 'ai-api' && renderAIAPITab()}
                    {activeTab === 'social-platforms' && renderSocialPlatformsTab()}
                </div>
            </div>

            {renderModal()}
        </div>
    );
};

export default Config;