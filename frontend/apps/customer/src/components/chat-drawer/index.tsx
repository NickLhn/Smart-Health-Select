import React, { useState, useEffect, useRef } from 'react';
import { Drawer, Input, Button, List, Avatar, Spin } from 'antd';
import { SendOutlined, UserOutlined } from '@ant-design/icons';
import { sendMessage, getHistory } from '../../services/im';
import type { ImMessage } from '../../services/im';

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
  targetUserId: number;
  targetUserName?: string;
}

const ChatDrawer: React.FC<ChatDrawerProps> = ({ open, onClose, targetUserId, targetUserName }) => {
  const [messages, setMessages] = useState<ImMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUserId(user.id);
      } catch (e) {}
    }
  }, []);

  const fetchHistory = async () => {
    if (!targetUserId) return;
    try {
      // 打开抽屉后按联系人维度拉历史消息，并依赖后端同步已读状态。
      const res = await getHistory(targetUserId);
      if (res.code === 200) {
        setMessages(res.data);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Fetch history failed', error);
    }
  };

  useEffect(() => {
    if (open && targetUserId) {
      // 客服抽屉打开后短轮询，保证能看到最新回复。
      fetchHistory();
      const timer = setInterval(fetchHistory, 3000);
      return () => clearInterval(timer);
    }
  }, [open, targetUserId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !targetUserId) return;
    try {
      // 发送成功后复用同一套取历史逻辑刷新消息列表。
      const res = await sendMessage(targetUserId, inputValue);
      if (res.code === 200) {
        setInputValue('');
        fetchHistory();
      }
    } catch (error) {
      console.error('Send message failed', error);
    }
  };

  return (
    <Drawer
      title={targetUserName || '联系商家'}
      placement="right"
      onClose={onClose}
      open={open}
      width={360}
      styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}
    >
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50" ref={scrollRef}>
        {messages.map((msg) => {
          const isMe = msg.fromUserId === currentUserId;
          return (
            <div key={msg.id} className={`flex mb-4 ${isMe ? 'justify-end' : 'justify-start'}`}>
              {!isMe && <Avatar icon={<UserOutlined />} className="mr-2" />}
              <div className={`max-w-[70%] p-3 rounded-lg ${isMe ? 'bg-green-500 text-white' : 'bg-white text-gray-800 shadow-sm'}`}>
                {msg.content}
              </div>
              {isMe && <Avatar icon={<UserOutlined />} className="ml-2 bg-green-600" />}
            </div>
          );
        })}
      </div>
      
      <div className="p-4 bg-white border-t">
        <div className="flex gap-2">
          <Input 
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onPressEnter={handleSend}
            placeholder="请输入消息..." 
          />
          <Button type="primary" icon={<SendOutlined />} onClick={handleSend}>
            发送
          </Button>
        </div>
      </div>
    </Drawer>
  );
};

export default ChatDrawer;
