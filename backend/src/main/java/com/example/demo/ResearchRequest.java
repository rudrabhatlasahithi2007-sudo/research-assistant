
package com.example.demo;

public class ResearchRequest {

    private String content;
    private String operation;

    public ResearchRequest() {
    }

    public ResearchRequest(String content, String operation) {
        this.content = content;
        this.operation = operation;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getOperation() {
        return operation;
    }

    public void setOperation(String operation) {
        this.operation = operation;
    }
}
