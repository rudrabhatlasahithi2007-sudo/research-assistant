
package com.example.demo;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/research")
@CrossOrigin(origins = "*")
public class ResearchController {

    private final ResearchService service;

    public ResearchController(ResearchService service) {
        this.service = service;
    }

    @PostMapping("/process")
    public ResponseEntity<String> processContent(
            @RequestBody ResearchRequest request) {

        String result = service.processContent(request);
        return ResponseEntity.ok(result);
    }
}
