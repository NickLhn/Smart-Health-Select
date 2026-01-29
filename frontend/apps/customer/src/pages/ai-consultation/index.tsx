import React, { useState, useRef, useEffect } from 'react';
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

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: Date.now(),
    };

    addMessage(userMessage);
    setInputValue('');
    setLoading(true);

    // Placeholder for AI message
    const aiMessageId = (Date.now() + 1).toString();
    const initialAiMessage: Message = {
      id: aiMessageId,
      text: '',
      sender: 'ai',
      timestamp: Date.now(),
    };
    addMessage(initialAiMessage);

    let currentText = '';
    await streamChatMessage(inputValue, {
      onMessage: (content) => {
        currentText += content;
        updateMessage(aiMessageId, { text: currentText });
      },
      onCards: (cards) => {
         updateMessage(aiMessageId, { recommendations: cards });
      },
      onDone: () => {
        setLoading(false);
      },
      onError: (error) => {
        console.error('AI chat failed', error);
        updateMessage(aiMessageId, { text: 'AI服务暂时繁忙，请稍后再试。' });
        setLoading(false);
      },
    });
  };

  return (
    <div className={isPopup ? "h-full flex flex-col bg-gray-50" : "flex flex-col h-[calc(100vh-64px)] md:h-[calc(100vh-140px)] w-full bg-gray-50 md:rounded-xl md:shadow-sm overflow-hidden"}>
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between shadow-sm flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
            <Button 
                type="text" 
                icon={<ArrowLeftOutlined />} 
                onClick={() => isPopup && onClose ? onClose() : navigate(-1)}
                className={isPopup ? "-ml-2" : "md:hidden -ml-2"}
            />
            <div className="w-10 h-10 rounded-full bg-[#00B96B]/10 flex items-center justify-center text-[#00B96B]">
                <RobotOutlined className="text-xl" />
            </div>
            <div>
                <h1 className="text-lg font-bold text-gray-800 m-0 leading-tight">智能客服</h1>
                <p className="text-xs text-gray-500 m-0">24小时在线为您服务</p>
            </div>
        </div>
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={handleClear}
        />
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
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
              className={`flex-shrink-0 ${
                  msg.sender === 'user' ? 'bg-blue-500' : 'bg-[#00B96B]'
              }`}
            />
            <div className="flex flex-col gap-2 max-w-[85%] md:max-w-[70%]">
              <div
                className={`p-3.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-blue-500 text-white rounded-tr-none'
                    : 'bg-white text-gray-800 rounded-tl-none'
                }`}
              >
                {msg.sender === 'ai' ? (
                  msg.text.trim() ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                      {msg.recommendations && msg.recommendations.length > 0 && (
                        <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
                          <div className="text-xs text-gray-500 font-medium mb-1">为您推荐相关药品：</div>
                          {msg.recommendations.map(med => (
                            <div 
                              key={med.id} 
                              className="bg-gray-50 rounded-xl p-2.5 flex gap-3 cursor-pointer hover:bg-gray-100 transition-colors border border-transparent hover:border-green-100" 
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
                                   <div className="text-[#ff4d4f] font-bold text-sm">¥{med.price ? Number(med.price).toFixed(2) : '0.00'}</div>
                                   <div className="bg-[#00B96B] text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
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
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  )
                ) : (
                  msg.text
                )}
              </div>
              {showThinking && msg.text.trim() && (
                <div className="bg-white p-3 rounded-2xl shadow-sm text-sm flex items-center gap-2 w-fit">
                  <span className="text-gray-500 text-sm">思考中</span>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
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
      <div className="bg-white p-4 border-t border-gray-100 flex-shrink-0 pb-safe">
        <div className="max-w-[1200px] mx-auto flex gap-3 items-end">
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
              className="rounded-2xl resize-none py-2.5 px-4 bg-gray-50 border-gray-200 focus:bg-white"
            />
            <Button 
              type="primary" 
              shape="circle" 
              icon={<SendOutlined />} 
              size="large" 
              onClick={handleSend}
              className="flex-shrink-0 bg-[#00B96B] hover:bg-[#009456] border-none shadow-lg shadow-[#00B96B]/20"
            />
        </div>
      </div>
    </div>
  );
};

export default AIConsultation;
