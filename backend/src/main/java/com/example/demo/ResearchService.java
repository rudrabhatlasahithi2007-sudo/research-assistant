
package com.example.demo;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
public class ResearchService {

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    public ResearchService(
            WebClient.Builder webClientBuilder,
            ObjectMapper objectMapper) {

        this.webClient = webClientBuilder.build();
        this.objectMapper = objectMapper;
    }

    public String processContent(ResearchRequest request) {

        if (request == null || request.getContent() == null
                || request.getContent().isBlank()) {
            throw new IllegalArgumentException(
                    "Please select some text first.");
        }

        String prompt = buildPrompt(
                request.getContent(),
                request.getOperation()
        );

        Map<String, Object> requestBody = Map.of(
                "contents", new Object[]{
                        Map.of("parts", new Object[]{
                                Map.of("text", prompt)
                        })
                }
        );

        String response = webClient.post()
                .uri(geminiApiUrl + geminiApiKey)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        return extractTextFromResponse(response);
    }

    private String buildPrompt(String content, String operation) {

        if (operation == null) {
            throw new IllegalArgumentException(
                    "Operation must not be null.");
        }

        return switch (operation) {

            case "summarize" -> """
                    Summarize the selected research text clearly.
                    Include the main idea, key points, and important
                    concepts. Use simple language and bullet points.
                    Do not invent facts.

                    TEXT:
                    """ + content;

            case "analyzeGaps" -> """
                    Analyze this selected passage for research gaps
                    and limitations.

                    Organize the response into:
                    1. Possible limitations
                    2. Unanswered questions
                    3. Concepts not covered in this passage
                    4. Suggested next learning or research steps

                    Clearly distinguish stated limitations from
                    your own reasonable inferences. Analyze only
                    the supplied passage; do not claim that a
                    concept is absent from the entire article.
                    Do not invent evidence.

                    SELECTED TEXT:
                    """ + content;

            case "generateQuiz" -> """
                    Generate 5 multiple-choice questions based only
                    on the supplied text.

                    Return ONLY valid JSON, without Markdown fences,
                    in this format:
                    {
                      "title": "Active Recall Quiz",
                      "questions": [
                        {
                          "question": "Question text",
                          "options": [
                            "Option A",
                            "Option B",
                            "Option C",
                            "Option D"
                          ],
                          "correctAnswer": 0,
                          "explanation": "Explanation of the answer",
                          "topic": "Topic name"
                        }
                      ]
                    }

                    Requirements:
                    - Exactly 4 options per question.
                    - correctAnswer must be an integer from 0 to 3.
                    - Provide a clear explanation for every answer.
                    - Keep questions relevant to the supplied text.
                    - Avoid ambiguous questions and invented facts.

                    TEXT:
                    """ + content;

            case "suggest" -> """
                    Suggest relevant next research steps based
                    on the supplied text. Keep suggestions practical
                    and distinguish suggestions from established facts.

                    TEXT:
                    """ + content;

            default -> throw new IllegalArgumentException(
                    "Unsupported operation: " + operation);
        };
    }

    private String extractTextFromResponse(String response) {

        try {
            JsonNode root = objectMapper.readTree(response);

            JsonNode textNode = root.path("candidates")
                    .path(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text");

            if (textNode.isMissingNode() || textNode.isNull()) {
                throw new IllegalStateException(
                        "Gemini returned no text. Check the API key, "
                        + "model endpoint, and API response.");
            }

            return textNode.asString();

        } catch (Exception e) {
            if (e instanceof IllegalStateException) {
                throw (IllegalStateException) e;
            }

            throw new IllegalStateException(
                    "Failed to parse the Gemini API response.", e);
        }
    }
}
