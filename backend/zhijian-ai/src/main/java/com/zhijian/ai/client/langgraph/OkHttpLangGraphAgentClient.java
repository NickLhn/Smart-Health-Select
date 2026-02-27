package com.zhijian.ai.client.langgraph;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;

@Component
public class OkHttpLangGraphAgentClient implements LangGraphAgentClient {

    private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");

    private final ObjectMapper objectMapper;
    private final OkHttpClient httpClient;
    private final String agentBaseUrl;

    public OkHttpLangGraphAgentClient(
            ObjectMapper objectMapper,
            @Value("${zhijian.ai.langgraph.agent-base-url:http://127.0.0.1:18081}") String agentBaseUrl
    ) {
        this.objectMapper = objectMapper;
        this.agentBaseUrl = normalizeBaseUrl(agentBaseUrl);
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(Duration.ofSeconds(3))
                .readTimeout(Duration.ofSeconds(70))
                .callTimeout(Duration.ofSeconds(70))
                .build();
    }

    @Override
    public AgentChatData chat(String conversationId, String message, String authorization, String requestId) throws IOException {
        String auth = normalizeAuthorization(authorization);
        AgentChatRequest payload = new AgentChatRequest();
        payload.setConversationId(conversationId);
        payload.setMessage(message);

        String bodyJson = objectMapper.writeValueAsString(payload);
        Request req = new Request.Builder()
                .url(agentBaseUrl + "/chat")
                .post(RequestBody.create(bodyJson, JSON))
                .header("Authorization", auth)
                .header("X-Request-ID", requestId)
                .build();

        try (Response resp = httpClient.newCall(req).execute()) {
            if (!resp.isSuccessful() || resp.body() == null) {
                String body = resp.body() == null ? "" : resp.body().string();
                throw new AgentHttpException(resp.code(), body);
            }
            AgentChatResponse parsed = objectMapper.readValue(resp.body().bytes(), AgentChatResponse.class);
            if (parsed == null || !Boolean.TRUE.equals(parsed.getSuccess()) || parsed.getData() == null) {
                throw new IOException("Agent response invalid");
            }
            AgentChatData out = new AgentChatData();
            out.setConversationId(parsed.getData().getConversationId());
            out.setReply(parsed.getData().getReply());
            out.setState(parsed.getData().getState());
            return out;
        }
    }

    private String normalizeBaseUrl(String base) {
        String val = base == null ? "" : base.trim();
        while (val.endsWith("/")) {
            val = val.substring(0, val.length() - 1);
        }
        if (val.isEmpty()) {
            throw new IllegalStateException("Empty agent base url");
        }
        return val;
    }

    private String normalizeAuthorization(String authorization) throws IOException {
        String auth = authorization == null ? "" : authorization.trim();
        if (auth.isEmpty()) {
            throw new IOException("Missing Authorization");
        }
        if (!auth.startsWith("Bearer ")) {
            auth = "Bearer " + auth;
        }
        return auth;
    }

    @Data
    private static class AgentChatRequest {
        private String conversationId;
        private String message;
    }

    @Data
    private static class AgentChatResponse {
        private Boolean success;
        private AgentChatDataInner data;
    }

    @Data
    private static class AgentChatDataInner {
        private String conversationId;
        private String reply;
        private java.util.Map<String, Object> state;
    }
}
