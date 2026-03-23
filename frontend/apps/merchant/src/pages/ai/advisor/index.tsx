import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { App, Button, Divider, Input, Space, Tag, Typography } from 'antd';
import { DeleteOutlined, EnterOutlined, LoadingOutlined, MessageOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { clearChatHistory, getChatHistory, streamChat } from '../../../services/ai';

type ChatRole = 'user' | 'assistant';

type ChatItem = {
  id: string;
  role: ChatRole;
  content: string;
  ts: number;
};

const MerchantAgent: React.FC = () => {
  const { message: messageApi, modal } = App.useApp();
  const navigate = useNavigate();
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [showRecentOnly, setShowRecentOnly] = useState(true);
  const listRef = useRef<HTMLDivElement | null>(null);

  const recentLimit = 80;

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  const visibleItems = useMemo(() => {
    if (!showRecentOnly) return items;
    if (items.length <= recentLimit) return items;
    return items.slice(-recentLimit);
  }, [items, recentLimit, showRecentOnly]);

  useEffect(() => {
    scrollToBottom();
  }, [visibleItems, scrollToBottom]);

  const loadHistory = useCallback(async () => {
    setBooting(true);
    try {
      // 商家 AI 历史消息会先拉到本地，便于做最近消息裁剪。
      const history = await getChatHistory();
      const mapped: ChatItem[] = (history || []).map((h) => ({
        id: h.id,
        role: h.sender === 'ai' ? 'assistant' : 'user',
        content: h.text || '',
        ts: h.timestamp || Date.now(),
      }));
      setItems(mapped);
    } catch {
      setItems([]);
    } finally {
      setBooting(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const needConfirm = useMemo(() => {
    const last = [...items].reverse().find((it) => it.role === 'assistant');
    if (!last) return false;
    return /请回复\s*1\s*确认/.test(last.content || '');
  }, [items]);

  const send = useCallback(
    async (text: string) => {
      const value = (text || '').trim();
      if (!value) return;
      if (loading) return;

      const now = Date.now();
      const userMsg: ChatItem = {
        id: `u_${now}`,
        role: 'user',
        content: value,
        ts: now,
      };
      const placeholder: ChatItem = {
        id: `a_${now}`,
        role: 'assistant',
        content: '',
        ts: now + 1,
      };
      setItems((prev) => [...prev, userMsg, placeholder]);
      setLoading(true);
      setInput('');

      try {
        let currentText = '';
        // 商家端走流式接口，边收到边更新最后一条 AI 消息。
        await streamChat(
          { message: value },
          {
            onMessage: (content) => {
              currentText += content;
              setItems((prev) =>
                prev.map((it) => (it.id === placeholder.id ? { ...it, content: currentText } : it)),
              );
            },
            onDone: () => {
              setLoading(false);
            },
            onError: (error) => {
              const type = error?.type || error?.error?.type;
              const raw = error?.message || error?.error?.message;
              let text = '请求失败，请稍后重试。';
              if (type === 'AUTH' || (typeof raw === 'string' && /status:\s*401/.test(raw))) {
                text = '登录已过期，请重新登录后再试。';
              } else if (type === 'TIMEOUT') {
                text = 'AI响应超时，请稍后再试。';
              } else if (type === 'UNAVAILABLE') {
                text = 'AI服务未启动或不可用，请稍后再试。';
              }
              setItems((prev) =>
                prev.map((it) => (it.id === placeholder.id ? { ...it, content: text } : it)),
              );
              setLoading(false);
            },
            onAction: (action) => {
              const type = action?.type || action?.actionType;
              const url = action?.url || action?.path;
              // action 事件允许后端直接指引前端跳转到指定业务页。
              if (type === 'NAVIGATE' && typeof url === 'string' && url) {
                navigate(url, { replace: Boolean(action?.replace) });
              }
            },
          },
        );
      } catch (e: any) {
        setItems((prev) =>
          prev.map((it) => {
            if (it.id !== placeholder.id) return it;
            return { ...it, content: '请求失败，请稍后重试。' };
          }),
        );
        messageApi.error(e?.message || '请求失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    },
    [loading, messageApi, navigate],
  );

  const handleClear = useCallback(() => {
    modal.confirm({
      title: '清空会话记录？',
      content: '清空后不可恢复，新的对话将重新开始。',
      okText: '清空',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await clearChatHistory();
          messageApi.success('已清空');
          // 清空后本地消息也同步重置，保持界面和服务端一致。
          setItems([]);
        } catch (e: any) {
          messageApi.error(e?.message || '清空失败');
        }
      },
    });
  }, [messageApi, modal]);

  const quickPrompts = useMemo(
    () => [
      '今日经营概览',
      '待处理订单',
      '待发货订单',
      '退款列表',
      '库存风险',
      '药品列表',
    ],
    [],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send(input);
      }
    },
    [input, send],
  );

  const renderMessage = useCallback((content: string) => {
    const text = content || '';
    const urlRegex = /(https?:\/\/[^\s]+)(?=\s|$)/g;

    const parseUrl = (raw: string) => {
      let u = raw.trim();
      u = u.replace(/[),.，。;；"”']+$/g, '');
      return u;
    };

    const isImageUrl = (url: string) => {
      try {
        const p = new URL(url).pathname.toLowerCase();
        return /\.(png|jpe?g|gif|webp)$/.test(p);
      } catch {
        return false;
      }
    };

    const lines = text.split('\n');
    const imageUrls: string[] = [];
    const lineNodes = lines.map((line, lineIndex) => {
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      for (const match of line.matchAll(urlRegex)) {
        const rawUrl = match[1];
        const idx = match.index ?? 0;
        if (idx > lastIndex) parts.push(line.slice(lastIndex, idx));
        const url = parseUrl(rawUrl);
        if (isImageUrl(url)) imageUrls.push(url);
        parts.push(
          <a key={`${lineIndex}-${idx}-${url}`} href={url} target="_blank" rel="noreferrer noopener" className="aa-link">
            {url}
          </a>,
        );
        lastIndex = idx + rawUrl.length;
      }
      if (lastIndex < line.length) parts.push(line.slice(lastIndex));
      return (
        <div key={lineIndex} className="aa-line">
          {parts.length ? parts : line}
        </div>
      );
    });

    const uniqImages = Array.from(new Set(imageUrls));
    const imageNodes =
      uniqImages.length === 0
        ? null
        : uniqImages.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer noopener" className="aa-imgLink">
              <img src={url} alt="" className="aa-img" />
            </a>
          ));

    return (
      <div>
        {lineNodes}
        {imageNodes}
      </div>
    );
  }, []);

  const pageStyles = `
    .aa-root {
      position: relative;
      padding: 10px 0;
    }
    .aa-shell {
      display: grid;
      grid-template-columns: 360px minmax(0, 1fr);
      gap: 18px;
    }
    @media (max-width: 980px) {
      .aa-shell {
        grid-template-columns: 1fr;
      }
    }
    .aa-panel {
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      background:
        radial-gradient(1200px 520px at 20% 10%, rgba(37, 99, 235, 0.18), rgba(37, 99, 235, 0) 55%),
        radial-gradient(900px 460px at 70% 70%, rgba(14, 165, 233, 0.14), rgba(14, 165, 233, 0) 58%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.78));
      box-shadow: 0 24px 55px rgba(2, 6, 23, 0.08);
      overflow: hidden;
    }
    .aa-panelHeader {
      padding: 16px 18px 12px;
      border-bottom: 1px solid rgba(15, 23, 42, 0.08);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .aa-title {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .aa-badge {
      width: 12px;
      height: 12px;
      border-radius: 999px;
      background: radial-gradient(circle at 30% 30%, rgba(34, 197, 94, 1), rgba(16, 185, 129, 1));
      box-shadow: 0 0 0 6px rgba(34, 197, 94, 0.14);
    }
    .aa-panelBody {
      padding: 14px 18px 18px;
    }
    .aa-promptGrid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 12px;
    }
    .aa-chip {
      border: 1px solid rgba(15, 23, 42, 0.12);
      background: rgba(255, 255, 255, 0.75);
      border-radius: 999px;
      padding: 8px 12px;
      cursor: pointer;
      transition: transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease;
      box-shadow: 0 10px 22px rgba(2, 6, 23, 0.06);
      max-width: 100%;
    }
    .aa-chip:hover {
      transform: translateY(-1px);
      border-color: rgba(37, 99, 235, 0.28);
      box-shadow: 0 14px 28px rgba(37, 99, 235, 0.12);
    }
    .aa-chat {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr) auto;
      height: clamp(560px, calc(100vh - 260px), 860px);
      min-height: 540px;
    }
    .aa-chatTop {
      padding: 14px 18px 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      border-bottom: 1px solid rgba(15, 23, 42, 0.08);
      background: rgba(255, 255, 255, 0.55);
      backdrop-filter: blur(10px);
    }
    .aa-list {
      padding: 18px;
      overflow: auto;
      background:
        radial-gradient(900px 500px at 10% 20%, rgba(37, 99, 235, 0.10), rgba(37, 99, 235, 0) 58%),
        linear-gradient(180deg, rgba(248, 250, 252, 0.78), rgba(241, 245, 249, 0.72));
    }
    .aa-row {
      display: flex;
      margin-bottom: 12px;
    }
    .aa-row.user {
      justify-content: flex-end;
    }
    .aa-row.assistant {
      justify-content: flex-start;
    }
    .aa-bubble {
      max-width: min(560px, 92%);
      border-radius: 18px;
      padding: 11px 12px;
      border: 1px solid rgba(15, 23, 42, 0.10);
      box-shadow: 0 14px 30px rgba(2, 6, 23, 0.08);
      position: relative;
    }
    .aa-bubble.user {
      background: linear-gradient(140deg, rgba(37, 99, 235, 1), rgba(14, 165, 233, 0.98));
      color: rgba(255, 255, 255, 0.96);
      border: 1px solid rgba(37, 99, 235, 0.18);
      box-shadow: 0 16px 34px rgba(37, 99, 235, 0.22);
    }
    .aa-bubble.assistant {
      background: rgba(255, 255, 255, 0.92);
      color: rgba(15, 23, 42, 0.88);
    }
    .aa-line {
      white-space: pre-wrap;
      word-break: break-word;
    }
    .aa-link {
      color: rgba(37, 99, 235, 1);
      text-decoration: underline;
      text-underline-offset: 2px;
      word-break: break-all;
    }
    .aa-imgLink {
      display: inline-block;
      margin-top: 10px;
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid rgba(15, 23, 42, 0.10);
      box-shadow: 0 14px 30px rgba(2, 6, 23, 0.10);
      max-width: 100%;
    }
    .aa-img {
      display: block;
      width: min(520px, 100%);
      height: auto;
    }
    .aa-meta {
      margin-top: 6px;
      font-size: 11px;
      opacity: 0.72;
      display: flex;
      justify-content: space-between;
      gap: 10px;
    }
    .aa-inputBar {
      padding: 14px 18px 18px;
      border-top: 1px solid rgba(15, 23, 42, 0.08);
      background: rgba(255, 255, 255, 0.70);
      backdrop-filter: blur(10px);
    }
    .aa-inputWrap {
      border-radius: 18px;
      border: 1px solid rgba(15, 23, 42, 0.12);
      background: rgba(255, 255, 255, 0.86);
      padding: 10px;
      box-shadow: 0 18px 38px rgba(2, 6, 23, 0.08);
    }
  `;

  return (
    <div className="aa-root">
      <style>{pageStyles}</style>
      <div className="aa-shell">
        <div className="aa-panel">
          <div className="aa-panelHeader">
            <div className="aa-title">
              <span className="aa-badge" aria-hidden="true" />
              <div style={{ minWidth: 0 }}>
                <Typography.Text style={{ fontWeight: 900, color: 'rgba(2, 6, 23, 0.90)' }}>
                  商家端智能体
                </Typography.Text>
                <div style={{ fontSize: 12, color: 'rgba(15, 23, 42, 0.60)' }}>经营概览 / 订单履约 / 售后 / 药品管理</div>
              </div>
            </div>
            <Tag color={needConfirm ? 'gold' : 'success'} style={{ borderRadius: 999, paddingInline: 10 }}>
              {needConfirm ? '待确认' : '就绪'}
            </Tag>
          </div>
          <div className="aa-panelBody">
            <Typography.Paragraph style={{ marginBottom: 10, color: 'rgba(15, 23, 42, 0.78)' }}>
              建议用自然语言下发指令，智能体会通过工具调用后端接口执行；涉及状态变更会强制二次确认。
            </Typography.Paragraph>
            <Divider style={{ margin: '12px 0' }} />
            <Typography.Text style={{ fontWeight: 850, color: 'rgba(15, 23, 42, 0.82)' }}>快捷指令</Typography.Text>
            <div className="aa-promptGrid" role="list">
              {quickPrompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  className="aa-chip"
                  onClick={() => setInput(p)}
                  title="点击填入输入框"
                >
                  <Typography.Text ellipsis style={{ maxWidth: 320, display: 'inline-block' }}>
                    {p}
                  </Typography.Text>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="aa-panel aa-chat">
          <div className="aa-chatTop">
            <Space size={10}>
              <MessageOutlined style={{ color: 'rgba(37, 99, 235, 1)' }} />
              <div>
                <Typography.Text style={{ fontWeight: 900, color: 'rgba(2, 6, 23, 0.90)' }}>对话</Typography.Text>
                <div style={{ fontSize: 12, color: 'rgba(15, 23, 42, 0.58)' }}>
                  {booting ? '加载历史记录…' : 'Enter 发送，Shift+Enter 换行'}
                </div>
              </div>
            </Space>
            <Space size={8}>
              <Button onClick={() => setShowRecentOnly((v) => !v)} disabled={loading} style={{ borderRadius: 999 }}>
                {showRecentOnly ? `显示全部（共 ${items.length} 条）` : `只看最近 ${recentLimit} 条`}
              </Button>
              {needConfirm && (
                <>
                  <Button
                    type="primary"
                    disabled={loading}
                    onClick={() => send('1')}
                    style={{
                      borderRadius: 999,
                      background: 'linear-gradient(90deg, rgba(37, 99, 235, 1), rgba(14, 165, 233, 1))',
                      border: 'none',
                      boxShadow: '0 18px 42px rgba(37, 99, 235, 0.20)',
                    }}
                  >
                    确认执行
                  </Button>
                  <Button danger disabled={loading} onClick={() => send('0')} style={{ borderRadius: 999 }}>
                    取消
                  </Button>
                </>
              )}
              <Button icon={<DeleteOutlined />} onClick={handleClear} disabled={loading} style={{ borderRadius: 999 }}>
                清空
              </Button>
            </Space>
          </div>

          <div className="aa-list" ref={listRef}>
            {visibleItems.length === 0 ? (
              <div style={{ padding: '42px 10px', textAlign: 'center' }}>
                <Typography.Text style={{ color: 'rgba(15, 23, 42, 0.60)' }}>
                  还没有对话。你可以先发：药品列表
                </Typography.Text>
              </div>
            ) : (
              visibleItems.map((it) => (
                <div key={it.id} className={`aa-row ${it.role}`}>
                  <div className={`aa-bubble ${it.role}`}>
                    <Typography.Paragraph style={{ marginBottom: 0 }}>
                      {it.content ? renderMessage(it.content) : it.role === 'assistant' && loading ? <LoadingOutlined /> : ''}
                    </Typography.Paragraph>
                    <div className="aa-meta">
                      <span>{it.role === 'user' ? '你' : '智能体'}</span>
                      <span>{dayjs(it.ts).format('HH:mm:ss')}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="aa-inputBar">
            <div className="aa-inputWrap">
              <Input.TextArea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="例如：药品列表 / 下架 1 / 删除 1"
                autoSize={{ minRows: 2, maxRows: 6 }}
                disabled={loading}
                style={{ border: 'none', boxShadow: 'none', background: 'transparent', resize: 'none' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <Typography.Text style={{ fontSize: 12, color: 'rgba(15, 23, 42, 0.55)' }}>
                  {needConfirm ? '当前有待确认操作，可直接点右上角按钮。' : '敏感操作会二次确认。'}
                </Typography.Text>
                <Button
                  type="primary"
                  icon={loading ? <LoadingOutlined /> : <EnterOutlined />}
                  onClick={() => send(input)}
                  disabled={loading || !input.trim()}
                  style={{
                    borderRadius: 999,
                    background: 'linear-gradient(90deg, rgba(37, 99, 235, 1), rgba(14, 165, 233, 1))',
                    border: 'none',
                    boxShadow: '0 18px 42px rgba(37, 99, 235, 0.18)',
                  }}
                >
                  发送
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantAgent;
