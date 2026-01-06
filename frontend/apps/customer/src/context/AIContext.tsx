import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Drawer } from 'antd';
import AIConsultation from '../pages/ai-consultation';

interface AIContextType {
  openAI: () => void;
  closeAI: () => void;
  isAIOpen: boolean;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAIOpen, setIsAIOpen] = useState(false);

  const openAI = () => setIsAIOpen(true);
  const closeAI = () => setIsAIOpen(false);

  return (
    <AIContext.Provider value={{ openAI, closeAI, isAIOpen }}>
      {children}
      <Drawer
        title={null}
        placement="right"
        onClose={closeAI}
        open={isAIOpen}
        width={window.innerWidth > 768 ? 480 : '100%'}
        styles={{ body: { padding: 0 } }}
        closable={false}
        destroyOnClose
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
