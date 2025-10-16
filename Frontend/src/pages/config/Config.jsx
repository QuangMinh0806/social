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

    // Load data when tab changes
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
        <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
                className={`px-6 py-3 font-medium transition-colors ${
                    activeTab === 'ai-api'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('ai-api')}
            >
                🤖 AI & API
            </button>
            <button
                className={`px-6 py-3 font-medium transition-colors ${
                    activeTab === 'social-platforms'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setActiveTab('social-platforms')}
            >
                🌐 Social Platforms
            </button>
        </div>
    );

    const renderAIAPITab = () => (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">🤖 AI Configuration</h2>
                <button
                    onClick={() => {
                        setEditingItem(null);
                        setFormData({ name: '', key: '' });
                        setIsModalOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    + Thêm AI
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {llmConfigs.map((config) => (
                        <div key={config.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {config.name} API Key
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="password"
                                        value={config.key}
                                        readOnly
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                    />
                                    <button
                                        onClick={() => handleEdit(config)}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                    >
                                        ✏️ Sửa
                                    </button>
                                    <button
                                        onClick={() => handleDelete(config.id)}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                    >
                                        🗑️
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
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
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">🌐 Social Platforms</h2>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {socialPlatforms.map((platform) => (
                        <div key={platform.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    {platform.avatar_url && (
                                        <img
                                            src={platform.avatar_url}
                                            alt={platform.page_name}
                                            className="w-16 h-16 rounded-full"
                                        />
                                    )}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">{platform.page_name}</h3>
                                        <p className="text-sm text-gray-600">Platform ID: {platform.platform_id}</p>
                                        <p className="text-sm text-gray-600">Followers: {platform.follower_count}</p>
                                        <p className="text-xs text-gray-500">
                                            Status: <span className={`font-medium ${
                                                platform.status === 'connected' ? 'text-green-600' : 'text-red-600'
                                            }`}>{platform.status}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <a
                                        href={platform.page_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                    >
                                        🔗 Visit
                                    </a>
                                    <button
                                        onClick={() => handleDelete(platform.id)}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderModal = () => {
        if (!isModalOpen) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <h3 className="text-xl font-bold mb-4">
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Nhập API Key"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                        <button
                            onClick={handleSave}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            💾 Lưu
                        </button>
                        <button
                            onClick={closeModal}
                            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                        >
                            ❌ Hủy
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-6">⚙️ Cấu hình hệ thống</h1>
                    
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
