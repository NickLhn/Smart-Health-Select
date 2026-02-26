import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Input, Button, Avatar } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, ArrowLeftOutlined, RightOutlined, DeleteOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { useAI, type Message } from '../../context/AIContext';
import { streamChatMessage } from '../../services/ai';

interface AIConsultationProps {
  isPopup?: boolean;
  onClose?: () => void;
}

type QuickReplyVariant = 'primary' | 'danger' | 'default';

type QuickReply = {
  key: string;
  label: string;
  sendText: string;
  variant?: QuickReplyVariant;
};

const compactCandidateLabel = (raw: string) => {
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= 18) return cleaned;
  return `${cleaned.slice(0, 18)}…`;
};

const buildQuickReplies = (text: string): QuickReply[] => {
  const t = (text ?? '').replace(/\r\n/g, '\n').trim();
  if (!t) return [];

  const hasOrderConfirm = /回复\s*1\s*确认下单/.test(t) && /回复\s*0\s*取消/.test(t);

  if (hasOrderConfirm) {
    return [
      { key: 'confirm', label: '确认下单', sendText: '1', variant: 'primary' },
      { key: 'cancel', label: '取消', sendText: '0', variant: 'danger' },
    ];
  }

  const hasPickHint =
    /回复\s*序号/.test(t) ||
    /回复\s*数字/.test(t) ||
    /序号即可/.test(t) ||
    /我需要你选择/.test(t) ||
    /请选择/.test(t);
  if (!hasPickHint) return [];

  const lines = t.split('\n').map((l) => l.trim()).filter(Boolean);
  const candidates: QuickReply[] = [];

  for (const line of lines) {
    const m = line.match(/^(\d{1,2})[)）]\s*(.+)$/);
    if (!m) continue;
    const idx = Number(m[1]);
    if (!Number.isFinite(idx) || idx <= 0) continue;
    const label = compactCandidateLabel(m[2]);
    candidates.push({
      key: `pick_${idx}`,
      label: `${idx} · ${label}`,
      sendText: String(idx),
      variant: 'default',
    });
  }

  const hasCancel = /回复\s*0\s*取消/.test(t) || /回复\s*0\s*取消下单/.test(t) || /0\s*取消/.test(t);
  const result = candidates.slice(0, 6);
  if (result.length > 0 && hasCancel) {
    result.push({ key: 'cancel', label: '取消', sendText: '0', variant: 'danger' });
  }
  return result;
};

const AIConsultation: React.FC<AIConsultationProps> = ({ isPopup = false, onClose }) => {
  const navigate = useNavigate();
  const { messages, addMessage, updateMessage, clearMessages, reloadMessages } = useAI();
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    void reloadMessages();
  }, [reloadMessages]);

  const handleClear = async () => {
    setLoading(false);
    await clearMessages();
  };

  const sendMessage = useCallback(async (rawText: string) => {
    const text = (rawText ?? '').trim();
    if (!text) return;
    if (loading) return;

    const now = Date.now();
    const idBase = `${now}_${Math.random().toString(16).slice(2)}`;

    const userMessage: Message = {
      id: `user_${idBase}`,
      text,
      sender: 'user',
      timestamp: now,
    };

    addMessage(userMessage);
    setInputValue('');
    setLoading(true);

    const aiMessageId = `ai_${idBase}`;
    const initialAiMessage: Message = {
      id: aiMessageId,
      text: '',
      sender: 'ai',
      timestamp: now + 1,
    };
    addMessage(initialAiMessage);

    let currentText = '';
    let navigated = false;
    await streamChatMessage(text, {
      onMessage: (content) => {
        currentText += content;
        updateMessage(aiMessageId, { text: currentText });
      },
      onCards: (cards) => {
        updateMessage(aiMessageId, { recommendations: cards });
      },
      onAction: (action) => {
        if (!action) return;
        const type = (action && (action.type || action.actionType)) as string | undefined;
        if (type !== 'NAVIGATE') return;
        const url = (action && (action.url || action.path)) as string | undefined;
        if (!url || typeof url !== 'string') return;
        const replace = Boolean(action && action.replace);
        navigated = true;
        if (isPopup && onClose) onClose();
        navigate(url, { replace });
      },
      onDone: () => {
        if (!navigated && /跳转到.*结算页/.test(currentText)) {
          if (isPopup && onClose) onClose();
          navigate('/order/checkout');
        }
        setLoading(false);
      },
      onError: (error) => {
        console.error('AI chat failed', error);
        const type = (error && (error.type || error.error?.type)) as string | undefined;
        const raw = (error && (error.message || error.error?.message)) as string | undefined;
        let text = 'AI服务暂时繁忙，请稍后再试。';
        if (type === 'AUTH') {
          text = '登录已过期，请重新登录后再试。';
        } else if (type === 'TIMEOUT') {
          text = 'AI响应超时，请稍后再试。';
        } else if (type === 'UNAVAILABLE') {
          text = 'AI服务未启动或不可用，请稍后再试。';
        } else if (type === 'NETWORK') {
          if (typeof raw === 'string' && /status:\s*401/.test(raw)) {
            text = '登录已过期，请重新登录后再试。';
          } else {
            text = '网络异常，请检查网络后重试。';
          }
        } else if (typeof raw === 'string' && /status:\s*401/.test(raw)) {
          text = '登录已过期，请重新登录后再试。';
        }
        updateMessage(aiMessageId, { text });
        setLoading(false);
      },
    });
  }, [addMessage, isPopup, loading, navigate, onClose, updateMessage]);

  const handleSend = useCallback(async () => {
    await sendMessage(inputValue);
  }, [inputValue, sendMessage]);

  const lastAiText = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const m = messages[i];
      if (m?.sender === 'ai') {
        return m.text ?? '';
      }
    }
    return '';
  }, [messages]);

  const quickReplies = useMemo(() => buildQuickReplies(lastAiText), [lastAiText]);

  return (
    <div className={isPopup ? "h-full flex flex-col bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50" : "flex flex-col h-[calc(100vh-64px)] md:h-[calc(100vh-140px)] w-full bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 md:rounded-2xl md:shadow-lg overflow-hidden border border-white/50"}>
      {/* Header */}
      <div className="glass-panel !bg-white/80 px-4 py-3 flex items-center justify-between shadow-sm flex-shrink-0 z-10 backdrop-blur-md border-b border-emerald-100/50 !rounded-none">
        <div className="flex items-center gap-3">
            <Button 
                type="text" 
                icon={<ArrowLeftOutlined />} 
                onClick={() => isPopup && onClose ? onClose() : navigate(-1)}
                className={isPopup ? "-ml-2 text-gray-600 hover:text-emerald-600" : "md:hidden -ml-2 text-gray-600 hover:text-emerald-600"}
            />
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-600 shadow-inner">
                <RobotOutlined className="text-xl" />
            </div>
            <div>
                <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 m-0 leading-tight">智能客服</h1>
                <p className="text-xs text-gray-500 m-0">24小时在线为您服务</p>
            </div>
        </div>
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={handleClear}
          className="hover:bg-red-50"
        />
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-emerald-200/50">
        {messages.map((msg, index) => {
          const isLast = index === messages.length - 1;
          const showThinking = loading && isLast && msg.sender === 'ai';

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
            <Avatar
              icon={msg.sender === 'user' ? <UserOutlined /> : <RobotOutlined />}
              className={`flex-shrink-0 shadow-md ${
                  msg.sender === 'user' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gradient-to-br from-emerald-400 to-teal-500'
              }`}
            />
            <div className="flex flex-col gap-2 max-w-[85%] md:max-w-[70%]">
              <div
                className={`p-3.5 rounded-2xl shadow-sm text-sm leading-relaxed backdrop-blur-sm ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-tr-none shadow-emerald-200'
                    : 'glass-panel !bg-white/90 text-gray-800 rounded-tl-none border border-white/50'
                }`}
              >
                {msg.sender === 'ai' ? (
                  msg.text.trim() ? (
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap prose-p:my-1 prose-headings:my-2 prose-a:text-emerald-600">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                      {msg.recommendations && msg.recommendations.length > 0 && (
                        <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                          <div className="text-xs text-gray-500 font-medium mb-1">为您推荐相关药品：</div>
                          {msg.recommendations.map(med => (
                            <div 
                              key={med.id} 
                              className="bg-white/60 rounded-xl p-2.5 flex gap-3 cursor-pointer hover:bg-emerald-50/50 transition-colors border border-gray-100 hover:border-emerald-200 hover:shadow-sm" 
                              onClick={() => {
                                navigate(`/product/${med.id}`);
                                if (isPopup && onClose) onClose();
                              }}
                            >
                               <img src={med.mainImage} className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-white border border-gray-100" />
                               <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                                 <div className="font-medium text-gray-900 line-clamp-1 text-sm">{med.name}</div>
                                 <div className="text-xs text-gray-500 line-clamp-1">{med.indication || '暂无描述'}</div>
                                 <div className="flex items-center justify-between mt-1">
                                   <div className="text-rose-500 font-bold text-sm">¥{med.price ? Number(med.price).toFixed(2) : '0.00'}</div>
                                   <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                     购买 <RightOutlined />
                                   </div>
                                 </div>
                               </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-sm">思考中</span>
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  )
                ) : (
                  msg.text
                )}
              </div>
              {showThinking && msg.text.trim() && (
                <div className="bg-white/80 backdrop-blur-sm p-3 rounded-2xl shadow-sm text-sm flex items-center gap-2 w-fit border border-white/50">
                  <span className="text-gray-500 text-sm">思考中</span>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="glass-panel !bg-white/80 p-4 border-t border-emerald-100/50 flex-shrink-0 pb-safe backdrop-blur-md !rounded-none">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-3">
            {quickReplies.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {quickReplies.map((qr) => {
                  const base =
                    "h-10 px-4 rounded-full border transition-all shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white/80 cursor-pointer disabled:cursor-not-allowed";

                  const cls =
                    qr.variant === 'primary'
                      ? `${base} text-white border-transparent bg-gradient-to-r from-emerald-500 to-teal-500 shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0`
                      : qr.variant === 'danger'
                        ? `${base} text-red-600 border-red-200 bg-white/70 hover:bg-red-50 disabled:opacity-60`
                        : `${base} text-gray-800 border-emerald-100 bg-white/70 hover:bg-emerald-50/60 disabled:opacity-60`;

                  return (
                    <button
                      key={qr.key}
                      type="button"
                      className={cls}
                      disabled={loading}
                      onClick={() => sendMessage(qr.sendText)}
                      aria-label={qr.label}
                    >
                      {qr.label}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex gap-3 items-end">
              <Input.TextArea
                placeholder="请输入您的问题..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                    if(e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
                autoSize={{ minRows: 1, maxRows: 4 }}
                className="rounded-2xl resize-none py-2.5 px-4 bg-white/50 border-emerald-100 focus:border-emerald-400 hover:border-emerald-300 focus:bg-white transition-all shadow-inner"
              />
              <Button 
                type="primary" 
                shape="circle" 
                icon={<SendOutlined />} 
                size="large" 
                onClick={handleSend}
                className="flex-shrink-0 bg-gradient-to-r from-emerald-500 to-teal-500 border-none shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all"
              />
            </div>
        </div>
      </div>
    </div>
  );
};

export default AIConsultation;
