package com.zhijian.ai.client.langgraph;

import java.io.IOException;
import java.util.Map;

/**
 * LangGraph 智能体客户端接口。
 */
public interface LangGraphAgentClient {

    /**
     * 发送对话请求并获取智能体响应。
     *
     * @param conversationId 会话 ID
     * @param message 用户消息
     * @param authorization 认证信息
     * @param requestId 请求 ID
     * @return 智能体响应数据
     * @throws IOException 调用智能体接口时发生异常
     */
    AgentChatData chat(String conversationId, String message, String authorization, String requestId) throws IOException;

    /**
     * 智能体对话响应数据。
     */
    class AgentChatData {

        /**
         * 会话 ID。
         */
        private String conversationId;

        /**
         * AI 回复内容。
         */
        private String reply;

        /**
         * 对话状态数据。
         */
        private Map<String, Object> state;

        /**
         * 获取会话 ID。
         *
         * @return 会话 ID
         */
        public String getConversationId() {
            return conversationId;
        }

        /**
         * 设置会话 ID。
         *
         * @param conversationId 会话 ID
         */
        public void setConversationId(String conversationId) {
            this.conversationId = conversationId;
        }

        /**
         * 获取 AI 回复内容。
         *
         * @return AI 回复内容
         */
        public String getReply() {
            return reply;
        }

        /**
         * 设置 AI 回复内容。
         *
         * @param reply AI 回复内容
         */
        public void setReply(String reply) {
            this.reply = reply;
        }

        /**
         * 获取对话状态数据。
         *
         * @return 对话状态数据
         */
        public Map<String, Object> getState() {
            return state;
        }

        /**
         * 设置对话状态数据。
         *
         * @param state 对话状态数据
         */
        public void setState(Map<String, Object> state) {
            this.state = state;
        }
    }

    /**
     * 智能体 HTTP 调用异常。
     */
    class AgentHttpException extends IOException {

        /**
         * HTTP 状态码。
         */
        private final int status;

        /**
         * 响应体内容。
         */
        private final String body;

        /**
         * 构造智能体 HTTP 调用异常。
         *
         * @param status HTTP 状态码
         * @param body 响应体内容
         */
        public AgentHttpException(int status, String body) {
            super("Agent HTTP " + status);
            this.status = status;
            this.body = body;
        }

        /**
         * 获取 HTTP 状态码。
         *
         * @return HTTP 状态码
         */
        public int getStatus() {
            return status;
        }

        /**
         * 获取响应体内容。
         *
         * @return 响应体内容
         */
        public String getBody() {
            return body;
        }
    }
}
