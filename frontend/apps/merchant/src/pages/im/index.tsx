import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Layout, List, Avatar, Input, Button, Empty, Badge, Tag, message } from 'antd';
import { UserOutlined, SendOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
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
  const [messageApi, contextHolder] = message.useMessage();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContactId, setActiveContactId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ImMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [contactKeyword, setContactKeyword] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const formatTime = useCallback((value?: string) => {
    if (!value) return '';
    const normalized = value.replace('T', ' ').replace(/\.\d+Z$/, '').replace(/Z$/, '');
    return normalized.length >= 16 ? normalized.slice(0, 16) : normalized;
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  }, []);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await getContacts();
      if (res.code === 200) {
        // 联系人列表轮询刷新，用来更新最后消息和未读数。
        setContacts(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!activeContactId) return;
    try {
      const res = await getHistory(activeContactId);
      if (res.code === 200) {
        // 打开会话时历史接口会顺带触发后端已读逻辑。
        setMessages(res.data);
        scrollToBottom();
      }
    } catch (error) {
      console.error(error);
    }
  }, [activeContactId, scrollToBottom]);

  useEffect(() => {
    fetchContacts();
    const timer = setInterval(fetchContacts, 5000);
    return () => clearInterval(timer);
  }, [fetchContacts]);

  useEffect(() => {
    if (activeContactId) {
      fetchMessages();
      const timer = setInterval(fetchMessages, 3000);
      return () => clearInterval(timer);
    }
  }, [activeContactId, fetchMessages]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || !activeContactId) return;
    if (sending) return;
    setSending(true);
    try {
      const res = await sendMessage(activeContactId, inputValue);
      if (res.code === 200) {
        setInputValue('');
        fetchMessages();
        // 发送成功后刷新联系人侧栏，确保最后一条消息同步变化。
        fetchContacts();
      } else {
        messageApi.error(res.message || '发送失败');
      }
    } catch (error) {
      console.error(error);
      messageApi.error('发送失败');
    } finally {
      setSending(false);
    }
  }, [activeContactId, fetchContacts, fetchMessages, inputValue, messageApi, sending]);

  const activeContact = contacts.find(c => c.userId === activeContactId);
  const filteredContacts = useMemo(() => {
    const keyword = contactKeyword.trim().toLowerCase();
    if (!keyword) return contacts;
    return contacts.filter((c) => {
      const name = (c.name || '').toLowerCase();
      const last = (c.lastMessage || '').toLowerCase();
      return name.includes(keyword) || last.includes(keyword);
    });
  }, [contactKeyword, contacts]);

  const totalUnread = useMemo(() => contacts.reduce((sum, c) => sum + (c.unreadCount || 0), 0), [contacts]);

  const pageStyles = `
    .im-root {
      position: relative;
    }
    .im-hero {
      position: relative;
      overflow: hidden;
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background:
        radial-gradient(900px 380px at 10% 10%, rgba(16, 185, 129, 0.22), rgba(16, 185, 129, 0) 55%),
        radial-gradient(760px 360px at 75% 18%, rgba(34, 211, 238, 0.16), rgba(34, 211, 238, 0) 60%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, rgba(255, 255, 255, 0.78) 100%);
      box-shadow: 0 26px 80px rgba(2, 6, 23, 0.10);
      padding: 14px 14px 12px;
      margin-bottom: 16px;
    }
    .im-hero::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.34;
      background-image: radial-gradient(rgba(15, 23, 42, 0.16) 1px, transparent 1px);
      background-size: 26px 26px;
      mask-image: radial-gradient(620px 460px at 65% 20%, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0));
    }
    .im-top {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
    }
    .im-title {
      margin: 0;
      font-size: 20px;
      font-weight: 900;
      letter-spacing: -0.3px;
      color: rgba(15, 23, 42, 0.92);
    }
    .im-sub {
      margin-top: 4px;
      font-size: 12px;
      color: rgba(15, 23, 42, 0.62);
    }
    .im-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .im-actions .ant-btn {
      border-radius: 999px;
      height: 36px;
      padding: 0 14px;
      font-weight: 650;
      border-color: rgba(15, 23, 42, 0.12);
      color: rgba(15, 23, 42, 0.78);
      background: rgba(255,255,255,0.78);
    }
    .im-chip.ant-tag {
      border-radius: 999px;
      padding-inline: 10px;
      margin-inline-end: 0;
      background: rgba(2, 6, 23, 0.04);
      border-color: rgba(15, 23, 42, 0.10);
      color: rgba(15, 23, 42, 0.70);
      font-weight: 650;
    }

    .im-shell {
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      box-shadow: 0 20px 60px rgba(2, 6, 23, 0.08);
      overflow: hidden;
      background: rgba(255, 255, 255, 0.86);
    }
    .im-layout {
      height: calc(100vh - 210px);
      background: transparent;
    }
    .im-sider {
      background: rgba(255,255,255,0.92) !important;
      border-right: 1px solid rgba(15, 23, 42, 0.08);
    }
    .im-siderTop {
      padding: 12px 12px 10px;
      border-bottom: 1px solid rgba(15, 23, 42, 0.08);
      background: rgba(255,255,255,0.90);
    }
    .im-siderList {
      height: calc(100% - 58px);
      overflow: auto;
    }
    .im-item {
      cursor: pointer;
      padding: 12px 12px;
      margin: 6px 8px;
      border-radius: 14px;
      border: 1px solid transparent;
      transition: background 160ms ease, border-color 160ms ease, transform 160ms ease;
    }
    .im-item:hover {
      background: rgba(2, 6, 23, 0.02);
      border-color: rgba(15, 23, 42, 0.08);
    }
    .im-itemActive {
      background: rgba(16, 185, 129, 0.10);
      border-color: rgba(5, 150, 105, 0.22);
      box-shadow: 0 16px 34px rgba(16, 185, 129, 0.10);
    }
    .im-itemTitle {
      font-weight: 800;
      color: rgba(15, 23, 42, 0.88);
      max-width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .im-itemDesc {
      color: rgba(15, 23, 42, 0.55);
      font-size: 12px;
      max-width: 190px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .im-time {
      color: rgba(15, 23, 42, 0.45);
      font-size: 12px;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .im-content {
      display: flex;
      flex-direction: column;
      background:
        radial-gradient(900px 520px at 10% 10%, rgba(16, 185, 129, 0.10), rgba(16, 185, 129, 0) 55%),
        radial-gradient(700px 380px at 80% 22%, rgba(34, 211, 238, 0.08), rgba(34, 211, 238, 0) 60%),
        linear-gradient(180deg, rgba(248, 250, 252, 0.86) 0%, rgba(241, 245, 249, 0.86) 100%);
    }
    .im-chatTop {
      height: 58px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 0 14px;
      background: rgba(255,255,255,0.92);
      border-bottom: 1px solid rgba(15, 23, 42, 0.08);
    }
    .im-chatName {
      font-weight: 900;
      color: rgba(15, 23, 42, 0.90);
      max-width: 420px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .im-chatBody {
      flex: 1 1 auto;
      overflow: auto;
      padding: 14px 14px 10px;
    }
    .im-row {
      display: flex;
      gap: 10px;
      margin: 10px 0;
      align-items: flex-end;
    }
    .im-rowMe { justify-content: flex-end; }
    .im-bubble {
      max-width: min(620px, 72%);
      padding: 10px 12px;
      border-radius: 14px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      box-shadow: 0 12px 30px rgba(2, 6, 23, 0.06);
      line-height: 1.55;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .im-bubbleMe {
      color: white;
      border: none;
      background: linear-gradient(90deg, rgba(5, 150, 105, 1), rgba(16, 185, 129, 1));
      box-shadow: 0 18px 42px rgba(5, 150, 105, 0.20);
    }
    .im-bubbleOther {
      background: rgba(255,255,255,0.92);
      color: rgba(15, 23, 42, 0.86);
    }
    .im-bubbleMeta {
      margin-top: 6px;
      font-size: 12px;
      opacity: 0.70;
      font-variant-numeric: tabular-nums;
    }
    .im-inputBar {
      padding: 10px 10px;
      background: rgba(255,255,255,0.92);
      border-top: 1px solid rgba(15, 23, 42, 0.08);
      display: flex;
      gap: 10px;
      align-items: flex-end;
    }
    .im-textarea.ant-input {
      border-radius: 14px !important;
      border-color: rgba(15, 23, 42, 0.10) !important;
      box-shadow: none !important;
      background: rgba(255,255,255,0.92) !important;
    }
    .im-sendBtn.ant-btn {
      border-radius: 999px;
      height: 40px;
      padding: 0 16px;
      font-weight: 800;
      border: none;
      background: linear-gradient(90deg, rgba(5, 150, 105, 1), rgba(16, 185, 129, 1));
      box-shadow: 0 18px 42px rgba(5, 150, 105, 0.20);
    }
    .im-sendBtn.ant-btn[disabled] { filter: grayscale(20%); box-shadow: none; }

    @media (max-width: 768px) {
      .im-layout { height: calc(100vh - 240px); }
    }
  `;

  return (
    <div className="im-root">
      {contextHolder}
      <style>{pageStyles}</style>

      <div className="im-hero" aria-label="消息中心概览">
        <div className="im-top">
          <div>
            <h2 className="im-title">消息中心</h2>
            <div className="im-sub">集中处理用户咨询与订单相关沟通，支持搜索会话与快捷回复</div>
          </div>
          <div className="im-actions">
            <Tag className="im-chip">未读 {totalUnread}</Tag>
            <Button icon={<ReloadOutlined />} onClick={fetchContacts}>
              刷新
            </Button>
          </div>
        </div>
      </div>

      <div className="im-shell">
        <Layout className="im-layout">
          <Sider width={320} theme="light" className="im-sider">
            <div className="im-siderTop">
              <Input
                value={contactKeyword}
                onChange={(e) => setContactKeyword(e.target.value)}
                allowClear
                placeholder="搜索联系人或最近一条消息"
                prefix={<SearchOutlined style={{ color: 'rgba(15, 23, 42, 0.45)' }} />}
              />
            </div>

            <div className="im-siderList" aria-label="会话列表">
              <List
                dataSource={filteredContacts}
                locale={{ emptyText: <Empty description="暂无会话" /> }}
                renderItem={(item) => (
                  <div
                    className={`im-item ${activeContactId === item.userId ? 'im-itemActive' : ''}`}
                    onClick={() => setActiveContactId(item.userId)}
                    role="button"
                    tabIndex={0}
                    aria-label={`打开与 ${item.name} 的对话`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveContactId(item.userId);
                      }
                    }}
                  >
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <Badge count={item.unreadCount} size="small" offset={[-2, 2]}>
                        <Avatar icon={<UserOutlined />} src={item.avatar} size={40} />
                      </Badge>
                      <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <div className="im-itemTitle">{item.name || '未知用户'}</div>
                          <div className="im-time">{formatTime(item.lastTime)}</div>
                        </div>
                        <div className="im-itemDesc">{item.lastMessage || '暂无消息'}</div>
                      </div>
                    </div>
                  </div>
                )}
              />
            </div>
          </Sider>

          <Content className="im-content">
            {activeContactId ? (
              <>
                <div className="im-chatTop">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <Avatar icon={<UserOutlined />} src={activeContact?.avatar} size={36} />
                    <div className="im-chatName">{activeContact?.name || '未知用户'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {activeContact?.unreadCount ? <Tag className="im-chip">未读 {activeContact.unreadCount}</Tag> : null}
                  </div>
                </div>

                <div className="im-chatBody" ref={scrollRef} aria-label="聊天记录">
                  {messages.map((msg) => {
                    const isMe = msg.fromUserId === user?.id;
                    return (
                      <div key={msg.id} className={`im-row ${isMe ? 'im-rowMe' : ''}`}>
                        {!isMe ? <Avatar icon={<UserOutlined />} src={activeContact?.avatar} size={32} /> : null}
                        <div className={`im-bubble ${isMe ? 'im-bubbleMe' : 'im-bubbleOther'}`}>
                          <div>{msg.content}</div>
                          <div className="im-bubbleMeta">{formatTime(msg.createTime)}</div>
                        </div>
                        {isMe ? <Avatar icon={<UserOutlined />} size={32} style={{ background: 'rgba(5, 150, 105, 1)' }} /> : null}
                      </div>
                    );
                  })}
                  {messages.length === 0 ? (
                    <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'rgba(15, 23, 42, 0.45)' }}>
                      <Empty description="暂无聊天记录，发一条消息试试" />
                    </div>
                  ) : null}
                </div>

                <div className="im-inputBar">
                  <Input.TextArea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onPressEnter={(e) => {
                      if (!e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="输入消息，Enter 发送，Shift+Enter 换行"
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    className="im-textarea"
                  />
                  <Button
                    className="im-sendBtn"
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSend}
                    disabled={!inputValue.trim() || sending}
                    loading={sending}
                  >
                    发送
                  </Button>
                </div>
              </>
            ) : (
              <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'rgba(15, 23, 42, 0.45)' }}>
                <Empty description="请选择联系人开始聊天" />
              </div>
            )}
          </Content>
        </Layout>
      </div>
    </div>
  );
};

export default ImPage;
