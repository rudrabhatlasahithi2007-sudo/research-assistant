🔬 AI Research Assistant

An AI-powered Chrome extension that helps users understand web content, discover research gaps, and learn effectively through active recall quizzes.

✨ Features

1. AI-Powered Webpage Summarization

Summarizes selected text from webpages.

Helps users understand lengthy articles and tutorials quickly.

Saves notes locally using Chrome Storage.

2. Research Gap & Limitation Analyzer

Identifies possible limitations in selected content.

Highlights unanswered questions and topics that may not be covered.

Suggests further learning and research directions.

3. Active Recall Quiz Generator

Generates quizzes based on selected webpage text.

Supports multiple-choice and short-answer learning activities where implemented.

Provides explanations and score calculation.

Stores quiz history locally for review.

🛠️ Technology Stack

Chrome Extension

HTML, CSS, JavaScript

Chrome Extension APIs

Chrome Storage API

Backend

Java

Spring Boot

Maven

WebClient

Google Gemini API

🏗️ Project Structure

ResearchAssistantExtension/
├── frontend/
│   ├── manifest.json
│   ├── sidepanel.html
│   ├── sidepanel.css
│   ├── sidepanel.js
│   └── background.js
├── backend/
│   ├── src/
│   └── pom.xml
├── .gitignore
└── README.md

⚙️ Setup and Installation

Prerequisites

Java and Maven (or the included Maven wrapper)

Google Gemini API key

Google Chrome

Git

1. Clone the repository

git clone https://github.com/YOUR_USERNAME/research-assistant.git
cd research-assistant

Replace YOUR_USERNAME with the GitHub account that owns this repository.

2. Configure the backend

Configure these environment variables before starting the Spring Boot application:

GEMINI_API_KEY — your Google Gemini API key.

GEMINI_API_URL — the Gemini API endpoint configured for this project.

The application is configured to use port 8081 by default.

Never commit your API key to GitHub.

3. Start the backend

Open the backend folder in a terminal and run:

cd backend

On Windows, you can use:

mvnw.cmd spring-boot:run

Alternatively, run the Spring Boot application from your IDE.

4. Load the Chrome extension

Open chrome://extensions in Google Chrome.

Enable Developer mode.

Click Load unpacked.

Select the repository's frontend folder.

Open a webpage, select some text, and test the extension.

The extension's backend URL must point to a running backend. For local development, it can use http://localhost:8081/api/research/process.

🔐 Security

Store API keys in environment variables.

Do not commit secrets, credentials, or private configuration files.

Restrict production API access appropriately.

Configure the extension's permissions and backend access for deployment.

🚀 Future Improvements

Deploy the backend to a cloud hosting service.

Improve quiz personalization using past quiz performance.

Add more research and learning workflows.

Improve error handling and production security.

👩‍💻 Author

Developed as an AI-powered research and learning productivity project.

📄 License

No license has been specified yet. Add a license if you intend to define permissions for reuse and distribution.
