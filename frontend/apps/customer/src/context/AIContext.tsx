import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Drawer } from 'antd';
import AIConsultation from '../pages/ai-consultation';
import type { Medicine } from '../services/medicine';
import { clearChatHistory, getChatHistory } from '../services/ai';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
  recommendations?: Medicine[];
}

interface AIContextType {
  openAI: () => void;
  closeAI: () => void;
  isAIOpen: boolean;
  messages: Message[];
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  reloadMessages: () => Promise<void>;
  clearMessages: () => Promise<void>;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

const WELCOME_MESSAGE: Message = {
  id: '1',
  text: `您好！欢迎来到智健优选。我是您的专属健康服务助手，很高兴为您服务！

我主要可以帮助您：

**📋 产品咨询与服务**
* 日常健康产品使用指导（例如：“季节性不适有什么建议？”）
* 了解产品特性与注意事项
* 健康生活小贴士分享

**📦 订单与配送查询**
* 查看订单状态和物流进度
* 协助查询具体订单信息
* 了解配送相关安排

**🔍 服务支持**
* 了解平台服务流程
* 查询服务所需资料
* 获取操作指引

请您直接告知我您的需求，我会尽力为您提供准确的信息和帮助！`,
  sender: 'ai',
  timestamp: Date.now(),
};

export const AIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const reloadMessages = useCallback(async () => {
    try {
      const history = await getChatHistory();
      if (history && history.length > 0) {
        setMessages(history);
      } else {
        setMessages([WELCOME_MESSAGE]);
      }
    } catch (e) {
      console.error('Failed to load chat history', e);
      setMessages([WELCOME_MESSAGE]);
    }
  }, []);

  useEffect(() => {
    reloadMessages();
  }, []);

  const openAI = () => {
    void reloadMessages();
    setIsAIOpen(true);
  };
  const closeAI = () => setIsAIOpen(false);

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  const updateMessage = (id: string, updates: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg))
    );
  };

  const clearMessages = async () => {
    try {
      await clearChatHistory();
    } catch (e) {
      console.error('Failed to clear chat history', e);
    }
    setMessages([WELCOME_MESSAGE]);
  };

  return (
    <AIContext.Provider value={{ openAI, closeAI, isAIOpen, messages, addMessage, updateMessage, reloadMessages, clearMessages }}>
      {children}
      <Drawer
        title={null}
        placement="right"
        onClose={closeAI}
        open={isAIOpen}
        width={window.innerWidth > 768 ? 480 : '100%'}
        styles={{ body: { padding: 0 } }}
        closable={false}
        // Remove destroyOnClose to keep state when just toggling visibility (though we now use global state anyway)
        // destroyOnClose 
        zIndex={1001} // Ensure it's above other elements
      >
        <AIConsultation isPopup={true} onClose={closeAI} />
      </Drawer>
    </AIContext.Provider>
  );
};

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};
