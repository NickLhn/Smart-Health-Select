import React, { useState, useEffect, useRef } from 'react';
import { Layout, List, Avatar, Input, Button, Empty, Badge } from 'antd';
import { UserOutlined, SendOutlined } from '@ant-design/icons';
import { getContacts, getHistory, sendMessage } from '../../services/im';
import type { ImMessage } from '../../services/im';
import { useAuth } from '../../context/AuthContext';

const { Sider, Content } = Layout;

interface Contact {
  userId: number;
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastTime?: string;
  unreadCount?: number;
}

const ImPage: React.FC = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContactId, setActiveContactId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ImMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchContacts = async () => {
    try {
      const res = await getContacts();
      if (res.code === 200) {
        setContacts(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMessages = async () => {
    if (!activeContactId) return;
    try {
      const res = await getHistory(activeContactId);
      if (res.code === 200) {
        setMessages(res.data);
        scrollToBottom();
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchContacts();
    const timer = setInterval(fetchContacts, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activeContactId) {
      fetchMessages();
      const timer = setInterval(fetchMessages, 3000);
      return () => clearInterval(timer);
    }
  }, [activeContactId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !activeContactId) return;
    try {
      const res = await sendMessage(activeContactId, inputValue);
      if (res.code === 200) {
        setInputValue('');
        fetchMessages();
        fetchContacts(); // Update last message in sidebar
      }
    } catch (error) {
      console.error(error);
    }
  };

  const activeContact = contacts.find(c => c.userId === activeContactId);

  return (
    <Layout className="h-[calc(100vh-100px)] bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
      <Sider width={280} theme="light" className="border-r border-gray-100">
        <div className="p-4 border-b border-gray-100 font-bold text-lg">
          消息列表
        </div>
        <div className="overflow-y-auto h-[calc(100%-60px)]">
          <List
            dataSource={contacts}
            renderItem={item => (
              <List.Item 
                className={`cursor-pointer transition-colors hover:bg-gray-50 !px-4 !py-3 ${activeContactId === item.userId ? 'bg-blue-50' : ''}`}
                onClick={() => setActiveContactId(item.userId)}
              >
                <List.Item.Meta
                  avatar={
                    <Badge count={item.unreadCount} size="small">
                      <Avatar icon={<UserOutlined />} src={item.avatar} />
                    </Badge>
                  }
                  title={<span className="font-medium">{item.name}</span>}
                  description={
                    <div className="flex justify-between w-full">
                      <span className="truncate w-32 text-xs text-gray-500">{item.lastMessage || '暂无消息'}</span>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      </Sider>
      <Content className="flex flex-col bg-gray-50">
        {activeContactId ? (
          <>
            <div className="h-14 border-b border-gray-200 bg-white flex items-center px-6 font-bold text-gray-700 shadow-sm z-10">
              {activeContact?.name || '未知用户'}
            </div>
            <div className="flex-1 overflow-y-auto p-6" ref={scrollRef}>
              {messages.map(msg => {
                const isMe = msg.fromUserId === user?.id;
                return (
                  <div key={msg.id} className={`flex mb-4 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && <Avatar icon={<UserOutlined />} className="mr-3" />}
                    <div className={`max-w-[60%] p-3 rounded-xl ${isMe ? 'bg-blue-500 text-white' : 'bg-white text-gray-800 shadow-sm'}`}>
                      {msg.content}
                    </div>
                    {isMe && <Avatar icon={<UserOutlined />} className="ml-3 bg-blue-600" />}
                  </div>
                );
              })}
            </div>
            <div className="h-40 bg-white border-t border-gray-200 p-4">
              <Input.TextArea 
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="请输入消息..."
                className="h-24 resize-none border-none focus:shadow-none mb-2"
              />
              <div className="flex justify-end">
                <Button type="primary" icon={<SendOutlined />} onClick={handleSend}>
                  发送
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 flex-col">
            <Empty description="请选择联系人开始聊天" />
          </div>
        )}
      </Content>
    </Layout>
  );
};

export default ImPage;
