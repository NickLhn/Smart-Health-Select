import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, List, Avatar, Spin, message } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons';
import { streamChat } from '../../../services/ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AiAdvisorPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '你好！我是智键优选智能客服（商家端），由智键医药开发的专业智能客服，专注为商家用户提供安全、高效的线上订单管理、药品咨询等服务，确保商家在平台运营中获得清晰、合规的解决方案。。' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInputValue('');
    setLoading(true);

    // 创建一个新的 assistant 消息占位符
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    let currentResponse = '';

    await streamChat(
      { message: userMessage },
      (content) => {
        currentResponse += content;
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = currentResponse;
          return newMessages;
        });
      },
      (error) => {
        console.error('Chat error:', error);
        message.error('请求失败，请稍后重试');
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 p-4">
      <Card 
        title={<><RobotOutlined className="mr-2 text-blue-500" /> AI 智能助手</>} 
        className="flex-1 flex flex-col shadow-md"
        bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '12px' }}
      >
        <div className="flex-1 overflow-y-auto mb-4 pr-2">
          <List
            dataSource={messages}
            renderItem={(item) => (
              <List.Item style={{ border: 'none', padding: '8px 0' }}>
                <div className={`w-full flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[80%] ${item.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <Avatar 
                      icon={item.role === 'user' ? <UserOutlined /> : <RobotOutlined />} 
                      className={`flex-shrink-0 ${item.role === 'user' ? 'ml-2 bg-blue-500' : 'mr-2 bg-green-500'}`}
                    />
                    <div className={`p-3 rounded-lg ${
                      item.role === 'user' 
                        ? 'bg-blue-100 text-gray-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {item.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        item.content
                      )}
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2">
          <Input.TextArea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="请输入您的问题，例如：今天销售情况如何？"
            autoSize={{ minRows: 1, maxRows: 4 }}
            disabled={loading}
          />
          <Button 
            type="primary" 
            icon={loading ? <Spin /> : <SendOutlined />} 
            onClick={handleSend}
            disabled={loading || !inputValue.trim()}
            className="h-auto"
          >
            发送
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AiAdvisorPage;
