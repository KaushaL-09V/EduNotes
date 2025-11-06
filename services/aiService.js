// src/services/aiService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({
    model: process.env.GOOGLE_MODEL || "gemini-1.5-flash",
});

/**
 * Generate structured notes from transcript using Google Gemini
 * @param {string} transcript - Video transcript
 * @param {string} title - Video title (optional)
 * @returns {object} Structured notes
 */
const generateNotes = async (transcript, title = "Video") => {
    try {
        const prompt = `
You are an expert note-taking assistant. Generate comprehensive, well-structured notes from the following video transcript.

Video Title: ${title}

Requirements:
1. Create a concise summary (2-3 sentences)
2. Extract 5-8 key points as bullet points
3. Organize content into logical sections with headings
4. Use clear, educational language
5. Highlight important concepts, definitions, and examples
6. Format the output as structured JSON

Transcript:
${transcript.substring(0, 12000)} ${transcript.length > 12000 ? "...(truncated)" : ""}

Return ONLY a valid JSON object with this exact structure:
{
  "summary": "Brief overview of the content",
  "keyPoints": ["Point 1", "Point 2", ...],
  "sections": [
    {
      "heading": "Section Title",
      "content": "Detailed content for this section"
    }
  ],
  "tags": ["tag1", "tag2", "tag3"]
}
`;

        const result = await model.generateContent(prompt);
        const content = result.response.text().trim();

        // Parse JSON response
        let structuredNotes;
        try {
            const jsonContent = content.replace(/```json\n?|\n?```/g, "").trim();
            structuredNotes = JSON.parse(jsonContent);
        } catch (err) {
            console.error("Failed to parse Gemini response:", content);
            throw new Error("Failed to parse AI-generated notes");
        }

        if (
            !structuredNotes.summary ||
            !structuredNotes.keyPoints ||
            !structuredNotes.sections
        ) {
            throw new Error("Invalid notes structure from Gemini AI");
        }

        const fullContent = generateFullContent(structuredNotes);

        return {
            ...structuredNotes,
            fullContent,
        };
    } catch (error) {
        console.error("Google AI Error:", error.message);
        throw new Error(`Failed to generate notes: ${error.message}`);
    }
};

/**
 * Generate full text content from structured notes
 * @param {object} structuredNotes - Structured notes object
 * @returns {string} Full content text
 */
const generateFullContent = (structuredNotes) => {
    let content = `# Summary\n\n${structuredNotes.summary}\n\n`;

    content += `# Key Points\n\n`;
    structuredNotes.keyPoints.forEach((point, index) => {
        content += `${index + 1}. ${point}\n`;
    });

    content += `\n# Detailed Notes\n\n`;
    structuredNotes.sections.forEach((section) => {
        content += `## ${section.heading}\n\n${section.content}\n\n`;
    });

    return content;
};

/**
 * Summarize text for quick preview using Gemini
 * @param {string} text - Text to summarize
 * @param {number} maxLength - Maximum summary length
 * @returns {string} Summary
 */
const quickSummarize = async (text, maxLength = 200) => {
    try {
        const prompt = `
Summarize the following text in one concise sentence (max ${maxLength} characters):
${text.substring(0, 3000)}
`;

        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (error) {
        console.error("Google AI Summary Error:", error.message);
        throw new Error(`Failed to generate summary: ${error.message}`);
    }
};

module.exports = {
    generateNotes,
    quickSummarize,
    generateFullContent,
};
