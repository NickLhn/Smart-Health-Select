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

/**
 * 基于 OkHttp 的 LangGraph 智能体客户端实现。
 */
@Component
public class OkHttpLangGraphAgentClient implements LangGraphAgentClient {

    /**
     * JSON 请求体媒体类型常量。
     */
    private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");

    /**
     * JSON 序列化工具。
     */
    private final ObjectMapper objectMapper;

    /**
     * HTTP 客户端。
     */
    private final OkHttpClient httpClient;

    /**
     * 智能体服务基础地址。
     */
    private final String agentBaseUrl;

    /**
     * 构造 OkHttp 智能体客户端。
     *
     * @param objectMapper JSON 序列化工具
     * @param agentBaseUrl 智能体服务基础地址
     */
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

    /**
     * 发送对话请求并解析智能体响应。
     *
     * @param conversationId 会话 ID
     * @param message 用户消息
     * @param authorization 认证信息
     * @param requestId 请求 ID
     * @return 智能体响应数据
     * @throws IOException 调用智能体接口时发生异常
     */
    @Override
    public AgentChatData chat(String conversationId, String message, String authorization, String requestId) throws IOException {
        String auth = normalizeAuthorization(authorization);
        // 下游 Agent 服务约定使用 conversationId 维持连续上下文。
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
                // 透传 HTTP 状态和响应体，方便上层做统一错误分类。
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

    /**
     * 规范化基础地址。
     *
     * @param base 原始基础地址
     * @return 规范化后的基础地址
     */
    private String normalizeBaseUrl(String base) {
        String val = base == null ? "" : base.trim();
        // 配置里末尾多余的斜杠统一去掉，避免后续拼接路径时出现双斜杠。
        while (val.endsWith("/")) {
            val = val.substring(0, val.length() - 1);
        }
        if (val.isEmpty()) {
            throw new IllegalStateException("Empty agent base url");
        }
        return val;
    }

    /**
     * 规范化认证请求头。
     *
     * @param authorization 原始认证信息
     * @return 规范化后的认证信息
     * @throws IOException 认证信息缺失时抛出异常
     */
    private String normalizeAuthorization(String authorization) throws IOException {
        String auth = authorization == null ? "" : authorization.trim();
        if (auth.isEmpty()) {
            throw new IOException("Missing Authorization");
        }
        // 兼容前端只传裸 token 的情况，这里统一补成 Bearer 头。
        if (!auth.startsWith("Bearer ")) {
            auth = "Bearer " + auth;
        }
        return auth;
    }

    /**
     * 智能体对话请求体。
     */
    @Data
    private static class AgentChatRequest {

        /**
         * 会话 ID。
         */
        private String conversationId;

        /**
         * 用户消息。
         */
        private String message;
    }

    /**
     * 智能体对话响应体。
     */
    @Data
    private static class AgentChatResponse {

        /**
         * 请求是否成功。
         */
        private Boolean success;

        /**
         * 响应数据。
         */
        private AgentChatDataInner data;
    }

    /**
     * 智能体对话响应数据体。
     */
    @Data
    private static class AgentChatDataInner {

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
        private java.util.Map<String, Object> state;
    }
}
