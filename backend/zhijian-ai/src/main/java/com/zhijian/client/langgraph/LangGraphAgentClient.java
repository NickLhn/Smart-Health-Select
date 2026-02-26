package com.zhijian.client.langgraph;

import java.io.IOException;
import java.util.Map;

public interface LangGraphAgentClient {
    AgentChatData chat(String conversationId, String message, String authorization, String requestId) throws IOException;

    class AgentChatData {
        private String conversationId;
        private String reply;
        private Map<String, Object> state;

        public String getConversationId() {
            return conversationId;
        }

        public void setConversationId(String conversationId) {
            this.conversationId = conversationId;
        }

        public String getReply() {
            return reply;
        }

        public void setReply(String reply) {
            this.reply = reply;
        }

        public Map<String, Object> getState() {
            return state;
        }

        public void setState(Map<String, Object> state) {
            this.state = state;
        }
    }

    class AgentHttpException extends IOException {
        private final int status;
        private final String body;

        public AgentHttpException(int status, String body) {
            super("Agent HTTP " + status);
            this.status = status;
            this.body = body;
        }

        public int getStatus() {
            return status;
        }

        public String getBody() {
            return body;
        }
    }
}

