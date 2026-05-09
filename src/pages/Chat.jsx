import React, { useContext, useEffect, useState, useRef } from 'react';
import { Send, Image, MoreVertical, Flag, AlertTriangle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs';
import { useToast } from '../components/Toast/ToastContext';
import api from '../api/axios';

import { useLocation, Link } from 'react-router-dom';

const Chat = () => {
    const { user, token } = useContext(AuthContext);
    const toast = useToast();
    const location = useLocation();
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const stompClientRef = useRef(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [myProfileImageUrl, setMyProfileImageUrl] = useState('');

    const formatMessageTime = (dateValue) => {
        if (!dateValue) return '';
        const parsed = new Date(dateValue);
        if (Number.isNaN(parsed.getTime())) return '';
        return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join('') || '?';
    };

    const resolveOnlineStatus = (conversation) => {
        const explicitOnline =
            conversation?.isOnline ??
            conversation?.online ??
            (typeof conversation?.onlineStatus === 'string' ? conversation.onlineStatus.toUpperCase() === 'ONLINE' : undefined);

        return Boolean(explicitOnline);
    };

    const resolveProfileImage = async (targetUserId) => {
        if (!targetUserId) return '';
        try {
            const profileRes = await api.get(`/profile?id=${targetUserId}`);
            const profileData = profileRes.data?.data || profileRes.data;
            return profileData?.profileImageUrl || '';
        } catch (error) {
            return '';
        }
    };

    const updatePresenceState = (targetUserId, isOnline) => {
        if (!targetUserId) return;

        setChats((prev) => prev.map((chat) => (
            String(chat.id) === String(targetUserId)
                ? { ...chat, isOnline: Boolean(isOnline) }
                : chat
        )));

        setSelectedChat((prev) => (
            prev && String(prev.id) === String(targetUserId)
                ? { ...prev, isOnline: Boolean(isOnline) }
                : prev
        ));
    };

    const markMessagesAsRead = (messageIds) => {
        if (!stompClientRef.current?.connected || !Array.isArray(messageIds) || messageIds.length === 0) {
            return;
        }

        messageIds.forEach((messageId) => {
            if (!messageId) return;
            stompClientRef.current.publish({
                destination: '/app/chat.read',
                body: JSON.stringify({ id: messageId })
            });
        });
    };

    const fetchConversations = async () => {
        try {
            const res = await api.get('/chat/conversations', {
                headers: {
                    'X-User-Id': user?.id
                }
            });

            const conversationUsers = await Promise.all(
                (res.data || []).map(async (conv) => {
                    const profileImageUrl =
                        conv.profileImageUrl ||
                        conv.avatarUrl ||
                        await resolveProfileImage(conv.userId);

                    return {
                        id: conv.userId,
                        name: conv.name,
                        lastMsg: conv.lastMessage,
                        time: conv.lastMessageTime ? new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                        unread: conv.unreadCount || 0,
                        profileImageUrl,
                        isOnline: resolveOnlineStatus(conv)
                    };
                })
            );

            setChats(conversationUsers);

            setSelectedChat(prev => {
                if (prev) {
                    const match = conversationUsers.find(u => u.id === prev.id);
                    return match || prev;
                }
                return prev;
            });

        } catch (error) {
            console.error("Failed to fetch conversations", error);
        }
    };

    useEffect(() => {
        if (location.state?.newChatUser) {
            const newUser = location.state.newChatUser;
            setSelectedChat({
                id: newUser.id,
                name: newUser.name,
                lastMsg: 'Yeni söhbət',
                time: '',
                unread: 0,
                profileImageUrl: newUser.profileImageUrl || newUser.avatarUrl || '',
                isOnline: Boolean(newUser.isOnline ?? newUser.online)
            });

            if (location.state?.product) {
                setSelectedProduct(location.state.product);
            }

            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    useEffect(() => {
        if (!token || !user) return;

        const fetchOwnProfile = async () => {
            try {
                const roleText = String(user?.role || user?.roles || user?.userRole || user?.authorities || '').toUpperCase();
                const isSeller = roleText.includes('SELLER') || roleText.includes('MARKET');
                const profileUrl = isSeller ? `/seller/profile/${user.id}` : '/profile';
                const res = await api.get(profileUrl);
                const myProfile = res.data?.data || res.data;
                setMyProfileImageUrl(myProfile?.profileImageUrl || '');
            } catch (error) {
                setMyProfileImageUrl('');
            }
        };

        fetchOwnProfile();
    }, [token, user]);

    const selectedChatRef = useRef(null);

    useEffect(() => {
        selectedChatRef.current = selectedChat;
    }, [selectedChat]);

    const fetchHistory = async (otherUserId) => {
        try {
            const res = await api.get(`/chat/history/${otherUserId}`, {
                headers: {
                    'X-User-Id': user?.id
                }
            });
            const history = Array.isArray(res.data) ? res.data : [];
            setMessages(history);

            const unreadIds = history
                .filter((message) => String(message.senderId) === String(otherUserId) && !message.isRead)
                .map((message) => message.id)
                .filter(Boolean);

            markMessagesAsRead(unreadIds);

            // Instant scroll to bottom when history is loaded
            setTimeout(() => scrollToBottom(true), 50);
        } catch (error) {
            console.error("Failed to fetch history", error);
        }
    };

    const scrollToBottom = (instant = false) => {
        const container = messagesEndRef.current?.parentElement;
        if (container) {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: instant ? "auto" : "smooth"
            });
        }
    };

    useEffect(() => {
        if (!token || !user) return;
        fetchConversations();

        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.netbazar.tech';
        const socket = new SockJS(`${baseUrl}/chat/ws`);
        const stompClient = new Client({
            webSocketFactory: () => socket,
            connectHeaders: { Authorization: `Bearer ${token}` },
            onConnect: () => {
                stompClient.subscribe('/user/queue/messages', (msg) => {
                    const receivedMessage = JSON.parse(msg.body);
                    const senderId = receivedMessage.senderId;
                    const receiverId = receivedMessage.receiverId;
                    const isIncomingForCurrentChat = String(selectedChatRef.current?.id) === String(senderId);
                    const isOutgoingAckForCurrentChat =
                        String(senderId) === String(user?.id)
                        && String(selectedChatRef.current?.id) === String(receiverId);

                    if (isIncomingForCurrentChat && receivedMessage.id) {
                        markMessagesAsRead([receivedMessage.id]);
                    }

                    // Update conversation list for ALL incoming messages
                    setChats(prev => {
                        const conversationUserId = String(senderId) === String(user?.id) ? receiverId : senderId;
                        const existing = prev.find(c => String(c.id) === String(conversationUserId));
                        
                        if (existing) {
                            // Update existing chat and move to top
                            const updatedChat = {
                                ...existing,
                                lastMsg: receivedMessage.content,
                                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                unread: isIncomingForCurrentChat ? 0 : (String(senderId) === String(user?.id) ? 0 : (existing.unread || 0) + 1),
                                isOnline: true
                            };
                            return [updatedChat, ...prev.filter(c => String(c.id) !== String(conversationUserId))];
                        } else {
                            // NEW CONVERSATION - Trigger fetch to get user info (like name)
                            fetchConversations();
                            return prev;
                        }
                    });

                    if (isIncomingForCurrentChat) {
                        setMessages(prev => [...prev, receivedMessage]);
                    } else if (isOutgoingAckForCurrentChat) {
                        setMessages((prev) => {
                            const pendingIndex = prev.findIndex((m) => (
                                !m.id
                                && String(m.senderId) === String(user?.id)
                                && String(m.receiverId) === String(receiverId)
                                && m.content === receivedMessage.content
                                && m.messageType === receivedMessage.messageType
                            ));

                            if (pendingIndex === -1) {
                                return [...prev, receivedMessage];
                            }

                            const next = [...prev];
                            next[pendingIndex] = { ...next[pendingIndex], ...receivedMessage };
                            return next;
                        });
                    }
                });

                stompClient.subscribe('/user/queue/presence', (msg) => {
                    const payload = JSON.parse(msg.body || '{}');
                    updatePresenceState(payload.userId, payload.isOnline);
                });

                stompClient.subscribe('/user/queue/read-receipts', (msg) => {
                    const payload = JSON.parse(msg.body || '{}');
                    if (!payload.messageId) return;
                    setMessages((prev) => prev.map((message) => (
                        message.id === payload.messageId
                            ? { ...message, isRead: true }
                            : message
                    )));
                });
            },
            onStompError: (frame) => console.error('STOMP error', frame.headers['message'])
        });

        stompClient.activate();
        stompClientRef.current = stompClient;

        return () => {
            if (stompClient) stompClient.deactivate();
        };
    }, [token, user]); // Only reconnect on auth change

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    useEffect(() => {
        if (selectedChat) {
            fetchHistory(selectedChat.id);
        }
    }, [selectedChat?.id]);

    const handleSendMessage = (content = inputMessage, type = 'TEXT') => {
        if ((!content || !content.trim()) && type === 'TEXT') return;
        if (!selectedChat) return;

        const messageData = {
            receiverId: selectedChat.id,
            content: content,
            productId: selectedProduct?.id,
            messageType: type,
            read: false
        };

        if (stompClientRef.current?.connected) {
            stompClientRef.current.publish({
                destination: '/app/chat.send',
                body: JSON.stringify(messageData)
            });

            const newMsg = {
                ...messageData,
                senderId: user?.id,
                sentAt: new Date().toISOString(),
                isRead: false
            };

            setMessages(prev => [...prev, newMsg]);

            setChats(prev => {
                const existing = prev.find(c => c.id === selectedChat.id);
                const chatToUpdate = existing || selectedChat;
                
                const updatedChat = {
                    ...chatToUpdate,
                    lastMsg: type === 'TEXT' ? content : `[${type}]`,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    unread: 0
                };
                
                return [updatedChat, ...prev.filter(c => c.id !== selectedChat.id)];
            });

            if (type === 'TEXT') setInputMessage("");
        }
    };

    const handleFileSelect = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const formData = new FormData();
                formData.append('file', file);

                const response = await api.post('/media/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                const url = response.data.data.url;
                const type = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
                
                handleSendMessage(url, type);
            }
        } catch (error) {
            console.error("Media upload failed", error);
            toast.error("Şəkil və ya video yüklənərkən xəta baş verdi.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleReportMessage = async (messageId) => {
        if (!window.confirm("Bu mesajı şikayət etmək istədiyinizdən əminsiniz?")) return;
        try {
            await api.put(`/chat/${messageId}/report-message`, {});
            
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isReported: true } : m));
            toast.success("Sikayetiniz qebul olundu. Tesekkurler!");
        } catch (error) {
            console.error("Failed to report message", error);
            toast.error("Şikayət göndərilə bilmədi.");
        }
    };

    const handleSelectChat = (chat) => {
        setSelectedChat({ ...chat, unread: 0 });
        setChats((prev) => prev.map((item) => (
            item.id === chat.id ? { ...item, unread: 0 } : item
        )));
    };

    return (
        <div className="container" style={{ padding: '1rem 20px', height: 'calc(100vh - 160px)', maxWidth: '1800px' }}>
            <div className={`glass chat-container ${selectedChat ? 'chat-selected' : ''}`} style={{
                display: 'grid',
                gridTemplateColumns: '350px 1fr',
                height: '100%',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow)'
            }}>
                {/* Sidebar */}
                <div className="chat-sidebar" style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                        <h2 style={{ fontSize: '1.5rem' }}>Mesajlar</h2>
                    </div>
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {chats.length === 0 && <div style={{ padding: '1rem', color: 'var(--text-light)' }}>Söhbət yoxdur</div>}
                        {chats.map(chat => (
                            <div key={chat.id}
                                onClick={() => handleSelectChat(chat)}
                                style={{
                                    padding: '1.2rem',
                                    borderBottom: '1px solid var(--border)',
                                    display: 'flex',
                                    gap: '12px',
                                    cursor: 'pointer',
                                    borderLeft: chat.unread > 0 && selectedChat?.id !== chat.id ? '3px solid #ef4444' : '3px solid transparent',
                                    backgroundColor:
                                        selectedChat?.id === chat.id
                                            ? 'rgba(17, 62, 33, 0.05)'
                                            : chat.unread > 0
                                                ? 'rgba(239, 68, 68, 0.06)'
                                                : 'transparent',
                                    transition: 'var(--transition)'
                                }}>
                                <div style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0 }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, overflow: 'hidden' }}>
                                        {chat.profileImageUrl ? (
                                            <img
                                                src={chat.profileImageUrl}
                                                alt={chat.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                            />
                                        ) : (
                                            getInitials(chat.name)
                                        )}
                                    </div>
                                    <span style={{
                                        position: 'absolute',
                                        right: 1,
                                        bottom: 1,
                                        width: '11px',
                                        height: '11px',
                                        borderRadius: '50%',
                                        backgroundColor: chat.isOnline ? '#22c55e' : '#9ca3af',
                                        boxShadow: '0 0 0 2px #fff'
                                    }} />
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontWeight: chat.unread > 0 ? 700 : 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.name}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>{chat.time}</span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: chat.unread > 0 ? '#b91c1c' : 'var(--text-light)', display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{chat.lastMsg}</span>
                                        {chat.unread > 0 && (
                                            <span style={{ backgroundColor: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700 }}>{chat.unread}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Message Area */}
                <div className="chat-main" style={{ display: selectedChat ? 'flex' : 'none', flexDirection: 'column', backgroundColor: 'white', height: '100%', overflow: 'hidden' }}>
                    {selectedChat ? (
                        <>
                            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button 
                                        className="mobile-only" 
                                        onClick={() => setSelectedChat(null)}
                                        style={{ marginRight: '8px', padding: '4px' }}
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <div style={{ position: 'relative', width: '40px', height: '40px', flexShrink: 0 }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, overflow: 'hidden' }}>
                                            {selectedChat.profileImageUrl ? (
                                                <img
                                                    src={selectedChat.profileImageUrl}
                                                    alt={selectedChat.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                                />
                                            ) : (
                                                getInitials(selectedChat.name)
                                            )}
                                        </div>
                                        <span style={{
                                            position: 'absolute',
                                            right: 0,
                                            bottom: 0,
                                            width: '10px',
                                            height: '10px',
                                            borderRadius: '50%',
                                            backgroundColor: selectedChat.isOnline ? '#22c55e' : '#9ca3af',
                                            boxShadow: '0 0 0 2px #fff'
                                        }} />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <span style={{ fontWeight: 700 }}>{selectedChat.name}</span>
                                        <span style={{ fontSize: '0.75rem', color: selectedChat.isOnline ? '#16a34a' : 'var(--text-light)' }}>
                                            {selectedChat.isOnline ? 'Online' : 'Offline'}
                                        </span>
                                    </div>
                                </div>
                                <MoreVertical size={20} color="var(--text-light)" />
                            </div>

                            {selectedProduct && (
                                <div style={{ padding: '0.8rem 1.5rem', backgroundColor: '#fdfdfd', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <img src={selectedProduct.imageUrl} alt={selectedProduct.title} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedProduct.title}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>{selectedProduct.price} ₼</div>
                                    </div>
                                    <button onClick={() => setSelectedProduct(null)} style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>x</button>
                                </div>
                            )}

                            <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', overflowY: 'auto', backgroundColor: '#fcfcfc' }}>
                                {messages.map((msg, idx) => (
                                    <div key={idx} className="message-wrapper" style={{
                                        alignItems: msg.senderId === user?.id ? 'flex-end' : 'flex-start'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'flex-end',
                                            gap: '8px',
                                            flexDirection: msg.senderId === user?.id ? 'row-reverse' : 'row'
                                        }}>
                                            <div style={{
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--accent)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#fff',
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                overflow: 'hidden',
                                                flexShrink: 0
                                            }}>
                                                {(msg.senderId === user?.id ? myProfileImageUrl : selectedChat?.profileImageUrl) ? (
                                                    <img
                                                        src={msg.senderId === user?.id ? myProfileImageUrl : selectedChat?.profileImageUrl}
                                                        alt={msg.senderId === user?.id ? (user?.name || 'Siz') : selectedChat?.name}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    msg.senderId === user?.id ? getInitials(user?.name || 'Siz') : getInitials(selectedChat?.name)
                                                )}
                                            </div>

                                            <div className="message-item" style={{
                                                alignSelf: msg.senderId === user?.id ? 'flex-end' : 'flex-start',
                                                backgroundColor: msg.senderId === user?.id ? 'var(--primary)' : 'var(--bg)',
                                                color: msg.senderId === user?.id ? 'white' : 'var(--text)',
                                                borderRadius: msg.senderId === user?.id ? '15px 15px 0 15px' : '15px 15px 15px 0',
                                                maxWidth: '85%',
                                                padding: (msg.messageType === 'IMAGE' || msg.messageType === 'VIDEO') ? '5px' : '10px 16px'
                                            }}>
                                                {msg.messageType === 'IMAGE' ? (
                                                    <img src={msg.content} alt="media" style={{ maxWidth: '100%', borderRadius: '10px', display: 'block' }} />
                                                ) : msg.messageType === 'VIDEO' ? (
                                                    <video src={msg.content} controls style={{ maxWidth: '100%', borderRadius: '10px', display: 'block' }} />
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {msg.productId && (
                                                            <Link 
                                                                to={`/product/${msg.productId}`}
                                                                style={{ 
                                                                    display: 'flex', 
                                                                    alignItems: 'center', 
                                                                    gap: '8px', 
                                                                    padding: '8px', 
                                                                    backgroundColor: msg.senderId === user?.id ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                                                    borderRadius: '8px',
                                                                    textDecoration: 'none',
                                                                    color: 'inherit',
                                                                    marginBottom: '4px',
                                                                    border: msg.senderId === user?.id ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--border)'
                                                                }}
                                                            >
                                                                <div style={{ width: '40px', height: '40px', borderRadius: '4px', backgroundColor: '#eee', overflow: 'hidden', flexShrink: 0 }}>
                                                                    <ProductThumbnail productId={msg.productId} userId={user?.id} />
                                                                </div>
                                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                                    <ProductTitle productId={msg.productId} userId={user?.id} />
                                                                </div>
                                                            </Link>
                                                        )}
                                                        <div style={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                                                            {msg.content}
                                                        </div>
                                                    </div>
                                                )}

                                                <div style={{
                                                    marginTop: '6px',
                                                    display: 'flex',
                                                    justifyContent: msg.senderId === user?.id ? 'flex-end' : 'flex-start',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    fontSize: '0.72rem',
                                                    color: msg.senderId === user?.id ? 'rgba(255,255,255,0.8)' : 'var(--text-light)'
                                                }}>
                                                    <span>{formatMessageTime(msg.sentAt)}</span>
                                                    {msg.senderId === user?.id && (
                                                        <span style={{ fontWeight: 700 }}>
                                                            {msg.isRead ? '✓✓' : '✓'}
                                                        </span>
                                                    )}
                                                </div>

                                                {msg.senderId !== user?.id && !msg.isReported && (
                                                    <button 
                                                        className="report-button"
                                                        onClick={() => handleReportMessage(msg.id)}
                                                        title="Şikayət et"
                                                    >
                                                        <Flag size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {msg.isReported && (
                                            <div className="reported-badge">
                                                <AlertTriangle size={12} />
                                                Şikayət olunub
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    hidden 
                                    multiple 
                                    accept="image/*,video/*" 
                                    onChange={handleFileSelect} 
                                />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                >
                                    {uploading ? (
                                        <div className="animate-spin" style={{ width: '20px', height: '20px', border: '2px solid #ccc', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
                                    ) : (
                                        <Image size={24} color="var(--text-light)" />
                                    )}
                                </button>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <input
                                        type="text"
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Mesaj yazın..."
                                        style={{
                                            width: '100%',
                                            padding: '10px 16px',
                                            borderRadius: '20px',
                                            border: '1px solid var(--border)',
                                            backgroundColor: '#f5f5f5',
                                            outline: 'none',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={() => handleSendMessage()}
                                    style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '10px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                                    <Send size={18} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fcfcfc', color: 'var(--text-light)' }} className="desktop-only">
                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ opacity: 0.5 }}>Söhbətə başlamaq üçün istifadəçi seçin</h3>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                @media (max-width: 768px) {
                    .chat-container { 
                        grid-template-columns: 1fr !important; 
                        height: calc(100vh - 140px) !important; 
                        width: 100% !important;
                        margin: 0 !important;
                        border-radius: 0 !important; 
                        box-shadow: none !important;
                    }
                    .chat-sidebar { display: ${selectedChat ? 'none' : 'flex'} !important; width: 100% !important; }
                    .chat-main { display: ${selectedChat ? 'flex' : 'none'} !important; width: 100% !important; }
                    .message-item { max-width: 85% !important; font-size: 0.9rem !important; }
                    .container { 
                        padding: 0 !important; 
                        margin: 0 !important; 
                        max-width: 100vw !important;
                        overflow-x: hidden !important;
                    }
                }
            `}</style>
        </div>
    );
};

const ChevronLeft = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

// --- Helper Components for Product Previews in Chat ---

const productCache = {};

const ProductThumbnail = ({ productId, userId }) => {
    const [imageUrl, setImageUrl] = useState(null);

    useEffect(() => {
        if (productCache[productId]) {
            setImageUrl(productCache[productId].imageUrls?.[0]);
            return;
        }

        const fetchProduct = async () => {
            try {
                const response = await api.get(`/product/${productId}`);
                const data = response.data.data;
                productCache[productId] = data;
                setImageUrl(data.imageUrls?.[0]);
            } catch (err) {
                console.warn("Product thumbnail fetch failed", productId);
            }
        };
        fetchProduct();
    }, [productId, userId]);

    if (!imageUrl) return <div style={{ width: '100%', height: '100%', backgroundColor: '#eee' }} />;
    return <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
};

const ProductTitle = ({ productId, userId }) => {
    const [info, setInfo] = useState(null);

    useEffect(() => {
        if (productCache[productId]) {
            setInfo(productCache[productId]);
            return;
        }

        const fetchProduct = async () => {
            try {
                const response = await api.get(`/product/${productId}`);
                const data = response.data.data;
                productCache[productId] = data;
                setInfo(data);
            } catch (err) {
                console.warn("Product title fetch failed", productId);
            }
        };
        fetchProduct();
    }, [productId, userId]);

    if (!info) return <div style={{ fontSize: '0.8rem', color: '#999' }}>Yüklənir...</div>;
    return (
        <>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {info.title}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                {info.price} ₼
            </div>
        </>
    );
};

export default Chat;
