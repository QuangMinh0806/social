import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import apiClient from '../services/api.service'

const YoutubeCallback = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const [status, setStatus] = useState('processing') // processing, success, error
    const [message, setMessage] = useState('Đang xử lý kết nối YouTube...')
    console.log('📍 YoutubeCallback mounted')
    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Lấy query parameters từ URL
                const urlParams = new URLSearchParams(location.search)
                const code = urlParams.get('code')
                const state = urlParams.get('state')
                const error = urlParams.get('error')

                console.log('🔍 YouTube callback params:', { code, state, error })

                if (error) {
                    console.error('YouTube auth error:', error)
                    setStatus('error')
                    setMessage(`Lỗi đăng nhập: ${error}`)

                    // Gửi lỗi về parent window nếu là popup
                    if (window.opener) {
                        window.opener.postMessage({
                            type: 'YOUTUBE_AUTH_ERROR',
                            error: error
                        }, window.location.origin)

                        setTimeout(() => window.close(), 2000)
                    } else {
                        setTimeout(() => navigate('/pages?error=' + error), 3000)
                    }
                    return
                }

                if (!code) {
                    console.error('No authorization code received')
                    setStatus('error')
                    setMessage('Không nhận được mã xác thực từ YouTube')

                    if (window.opener) {
                        window.opener.postMessage({
                            type: 'YOUTUBE_AUTH_ERROR',
                            error: 'No authorization code'
                        }, window.location.origin)

                        setTimeout(() => window.close(), 2000)
                    } else {
                        setTimeout(() => navigate('/pages?error=no_code'), 3000)
                    }
                    return
                }

                // Gọi API callback để lấy dữ liệu
                setMessage('Đang lấy thông tin từ YouTube...')
                console.log('🚀 Calling YouTube callback API with code:', code)

                const response = await apiClient.get(`/youtube/callback`, {
                    params: { code, state },
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`, // Nếu cần
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000 // 30 seconds timeout
                })

                console.log('📋 YouTube callback response:', response)

                if (response.success) {
                    const {
                        token_info,
                        user_info,
                        youtube_channels,
                        page_data,
                        redirect_url
                    } = response

                    setStatus('success')
                    setMessage('Kết nối YouTube thành công!')

                    // Nếu là popup, gửi dữ liệu về parent window
                    if (window.opener && !window.opener.closed) {
                        try {
                            window.opener.postMessage({
                                type: 'YOUTUBE_AUTH_SUCCESS',
                                data: {
                                    token_info,
                                    user_info,
                                    youtube_channels,
                                    page_data
                                }
                            }, window.location.origin)

                            // Đóng popup sau 1.5 giây
                            setTimeout(() => {
                                try {
                                    window.close()
                                } catch (e) {
                                    console.log('Cannot close popup:', e)
                                }
                            }, 1500)
                        } catch (postMessageError) {
                            console.error('Error posting message to parent:', postMessageError)
                            // Fallback: redirect về pages với success message
                            setTimeout(() => {
                                window.location.href = '/pages?youtube_success=1'
                            }, 2000)
                        }
                    } else {
                        // Nếu không phải popup, lưu vào localStorage và redirect
                        localStorage.setItem('youtube_auth_data', JSON.stringify({
                            token_info,
                            user_info,
                            youtube_channels,
                            page_data
                        }))

                        setTimeout(() => {
                            navigate(redirect_url || '/pages')
                        }, 2000)
                    }

                } else {
                    console.error('YouTube callback failed:', response.message)
                    setStatus('error')
                    setMessage(`Lỗi: ${response.message}`)

                    if (window.opener) {
                        window.opener.postMessage({
                            type: 'YOUTUBE_AUTH_ERROR',
                            error: response.message
                        }, window.location.origin)

                        setTimeout(() => window.close(), 2000)
                    } else {
                        setTimeout(() => {
                            navigate('/pages?error=' + encodeURIComponent(response.message))
                        }, 3000)
                    }
                }

            } catch (error) {
                console.error('❌ Error in YouTube callback:', error)
                setStatus('error')
                setMessage(`Lỗi kết nối: ${error.message}`)

                if (window.opener) {
                    window.opener.postMessage({
                        type: 'YOUTUBE_AUTH_ERROR',
                        error: error.message
                    }, window.location.origin)

                    setTimeout(() => window.close(), 2000)
                } else {
                    setTimeout(() => {
                        navigate('/pages?error=' + encodeURIComponent(error.message))
                    }, 3000)
                }
            }
        }

        handleCallback()
    }, [location, navigate])

    const getStatusIcon = () => {
        switch (status) {
            case 'processing':
                return (
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                )
            case 'success':
                return (
                    <div className="rounded-full h-12 w-12 bg-green-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                )
            case 'error':
                return (
                    <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </div>
                )
            default:
                return null
        }
    }

    const getStatusColor = () => {
        switch (status) {
            case 'processing':
                return 'text-gray-800'
            case 'success':
                return 'text-green-800'
            case 'error':
                return 'text-red-800'
            default:
                return 'text-gray-800'
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-center mb-4">
                    {getStatusIcon()}
                </div>

                <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800">
                        YouTube Callback
                    </h2>
                </div>

                <p className={`text-center mb-4 ${getStatusColor()}`}>
                    {message}
                </p>

                {status === 'processing' && (
                    <div className="text-center text-sm text-gray-500">
                        <p>Đang xử lý thông tin từ Google...</p>
                        <p className="mt-1">Vui lòng không đóng cửa sổ này</p>
                    </div>
                )}

                {status === 'success' && !window.opener && (
                    <div className="text-center text-sm text-gray-500">
                        <p>Đang chuyển hướng...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center">
                        <button
                            onClick={() => {
                                if (window.opener) {
                                    window.close()
                                } else {
                                    navigate('/pages')
                                }
                            }}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                            {window.opener ? 'Đóng cửa sổ' : 'Quay về trang Pages'}
                        </button>
                    </div>
                )}

                {/* Debug info trong development */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs">
                        <p className="font-semibold text-yellow-800">Debug Info:</p>
                        <p className="text-yellow-700">Status: {status}</p>
                        <p className="text-yellow-700">Is Popup: {window.opener ? 'Yes' : 'No'}</p>
                        <p className="text-yellow-700">URL: {location.pathname + location.search}</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default YoutubeCallback
