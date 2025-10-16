import React, { useState, useEffect } from 'react'
import axios from 'axios'

const ConnectWithYoutube = ({ userId, pageId, onTokenUpdate }) => {
    const [isConnecting, setIsConnecting] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [channelInfo, setChannelInfo] = useState(null)
    const [error, setError] = useState('')
    const [accessToken, setAccessToken] = useState('')
    const [currentPage, setCurrentPage] = useState(null)
    const [youtubePlatformId, setYoutubePlatformId] = useState()

    const API_BASE_URL = 'http://localhost:8000'

    useEffect(() => {
        const ensureYoutubePlatform = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/platforms`)
                const platforms = response.data.data || response.data

                const youtubePlatform = platforms.find(p =>
                    p.name?.toLowerCase().includes('youtube') ||
                    p.platform_name?.toLowerCase().includes('youtube')
                )
                console.log('YouTube platform from DB:', youtubePlatform)
                if (youtubePlatform) {
                    setYoutubePlatformId(youtubePlatform.id)
                } else {
                    console.warn('YouTube platform not found in database. Using default ID: 2')
                }
            } catch (error) {
                console.error('Lỗi khi kiểm tra platform:', error)
            }
        }

        ensureYoutubePlatform()
    }, [])

    useEffect(() => {
        const loadPageData = async () => {
            try {
                if (pageId) {
                    const response = await axios.get(`${API_BASE_URL}/api/pages/${pageId}`)
                    const pageData = response.data.data
                    setCurrentPage(pageData)

                    if (pageData.access_token) {
                        setAccessToken(pageData.access_token)
                        setIsConnected(true)
                        await getChannelInfoFromToken(pageData.access_token)
                    }
                }
            } catch (error) {
                console.error('Lỗi khi load page data:', error)
            }
        }

        loadPageData()
    }, [pageId])

    const getChannelInfoFromToken = async (token) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/youtube/profile`, {
                params: { access_token: token }
            })

            if (response.data.success) {
                setChannelInfo(response.data.channel_info)
            }
        } catch (error) {
            console.error('Lỗi khi lấy thông tin channel:', error)
        }
    }

    const saveTokenToDatabase = async (data) => {
        try {
            const res = axios.post(`${API_BASE_URL}/api/pages/`, data)
            console.log('🚀 Saving token to database...', res)
        } catch (error) {
            console.error('❌ Lỗi khi lưu token:', error)
            console.error('Error response:', error.response?.data)
            throw error
        }
    }

    const handleConnectYoutube = async () => {
        try {
            setIsConnecting(true)
            setError('')

            console.log('🚀 Bắt đầu kết nối YouTube...')

            const response = await axios.get(`${API_BASE_URL}/youtube/connect`)
            console.log('YouTube connect response:', response.data)
            if (response.data.success) {
                const authWindow = window.open(
                    response.data.auth_url,
                    'youtube_auth',
                    'width=500,height=600,scrollbars=yes,resizable=yes'
                )

                if (!authWindow) {
                    setError('Popup bị chặn. Vui lòng cho phép popup và thử lại.')
                    setIsConnecting(false)
                    return
                }

                const messageListener = async (event) => {
                    if (event.origin !== window.location.origin) return

                    console.log('📨 Received message from popup:', event.data)

                    if (event.data.type === 'YOUTUBE_AUTH_SUCCESS') {
                        const {
                            token_info,
                            user_info,
                            youtube_channels,
                            page_data
                        } = event.data.data

                        try {
                            // Bổ sung thông tin cần thiết cho page_data
                            const completePageData = {
                                ...page_data,
                                refresh_token: token_info.refresh_token,
                                platform_id: youtubePlatformId,
                                created_by: userId || 1 // Fallback user ID
                            }

                            console.log('💾 Saving complete page data:', completePageData)

                            // Lưu vào database
                            await saveTokenToDatabase(completePageData)

                            // Cập nhật UI với thông tin từ callback
                            setAccessToken(token_info.access_token)

                            // Sử dụng thông tin từ page_data hoặc youtube_channels
                            const channelInfo = youtube_channels[0] || {}
                            setChannelInfo({
                                title: page_data.page_name || channelInfo.snippet?.title,
                                thumbnail: page_data.avatar_url || channelInfo.snippet?.thumbnails?.default?.url,
                                subscriber_count: page_data.follower_count || channelInfo.statistics?.subscriberCount,
                                video_count: channelInfo.statistics?.videoCount || 0,
                                view_count: channelInfo.statistics?.viewCount || 0,
                                id: page_data.page_id || channelInfo.id
                            })

                            setIsConnected(true)
                            setIsConnecting(false)
                            setError('')

                            // Đóng popup
                            if (authWindow && !authWindow.closed) {
                                authWindow.close()
                            }

                            // Xóa event listener
                            window.removeEventListener('message', messageListener)

                            console.log('✅ YouTube connected successfully!')

                            // Optional: Gọi callback nếu có
                            if (onTokenUpdate) {
                                onTokenUpdate(token_info.access_token)
                            }

                        } catch (err) {
                            console.error('❌ Lỗi lưu token:', err)
                            setError('Lỗi khi lưu thông tin kết nối: ' + err.message)
                            setIsConnecting(false)

                            if (authWindow && !authWindow.closed) {
                                authWindow.close()
                            }
                            window.removeEventListener('message', messageListener)
                        }

                    } else if (event.data.type === 'YOUTUBE_AUTH_ERROR') {
                        // Đăng nhập thất bại
                        console.error('❌ Auth error:', event.data.error)
                        setError(event.data.error || 'Lỗi khi đăng nhập YouTube')
                        setIsConnecting(false)

                        if (authWindow && !authWindow.closed) {
                            authWindow.close()
                        }
                        window.removeEventListener('message', messageListener)
                    }
                }

                // Thêm event listener
                window.addEventListener('message', messageListener)

                if (!authWindow) {
                    setError('Popup bị chặn. Vui lòng cho phép popup và thử lại.')
                    setIsConnecting(false)
                    return
                }

            } else {
                setError('Không thể tạo URL đăng nhập YouTube')
                setIsConnecting(false)
            }

        } catch (err) {
            console.error('❌ Lỗi kết nối YouTube:', err)
            setError('Lỗi kết nối với server: ' + (err.response?.data?.detail || err.message))
            setIsConnecting(false)
        }
    }

    return (
        <div className="rounded-lg shadow-md p-6 max-w-md mx-auto">
            {error && (
                <div className="text-red-700 px-4 py-3 rounded mb-4">
                    <p className="text-sm">{error}</p>
                </div>
            )
            }
            {
                !isConnected ? (
                    <div>
                        <button
                            onClick={handleConnectYoutube}
                            disabled={isConnecting}
                            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${isConnecting
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                                }`}
                        >
                            {isConnecting ? (
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Đang kết nối...
                                </div>
                            ) : (
                                'Kết nối với YouTube'
                            )}
                        </button>
                    </div>
                ) : (
                    <div>
                        {channelInfo && (
                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <div className="flex items-center mb-3">
                                    {channelInfo.thumbnail && (
                                        <img
                                            src={channelInfo.thumbnail}
                                            alt="Channel thumbnail"
                                            className="w-12 h-12 rounded-full mr-3"
                                        />
                                    )}
                                    <div>
                                        <h4 className="font-semibold text-gray-800">
                                            {channelInfo.title || channelInfo.snippet?.title}
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                            {channelInfo.subscriber_count || channelInfo.statistics?.subscriberCount} subscribers
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Videos:</span>
                                        <span className="ml-1 font-medium">
                                            {channelInfo.video_count || channelInfo.statistics?.videoCount || 0}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Views:</span>
                                        <span className="ml-1 font-medium">
                                            {channelInfo.view_count || channelInfo.statistics?.viewCount || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )
            }

        </div >
    )
}

export default ConnectWithYoutube