import { Injectable } from "@nestjs/common";
import OpenAI from "openai";
import type { AiIntakeProvider } from "./ai-intake-provider.interface";
import { IntakeResultDto } from "../dto/intake-result.dto";
@Injectable()
export class OpenRouterAiIntakeProvider implements AiIntakeProvider {
    private readonly client = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1'
    });
    async analyze(text: string): Promise<IntakeResultDto> {
        const response = await this.client.chat.completions.create({
            model: 'openrouter/free',
            messages: [
                {
                    role: 'system',
                    content: `
                    You analyze internal company service requests.
                    Return valid JSON only.
                    Allowed departments:
                    - IT
                    - HR
                    - Finance
                    Allowed priorities:
                    - low
                    - normal
                    - high
                    Allowed categories:
                    - hardware
                    - software
                    - access
                    - employment_document
                    - leave
                    - employee_support
                    - reimbursement
                    - payroll
                    - expense
                    Rules:
                    1. Do not invent departments or categories.
                    2. If the request is clear:
                    - return a valid department
                    - return a valid category
                    - needsReview must be false
                    3. If the request is unclear, thin, or ambiguous:
                    - department must be null
                    - category must be null
                    - needsReview must be true
                    4. priority must always be:
                    low, normal, or high
                    5. summary must be short and based only on the user's request.
                    Return exactly this JSON structure:
                    {
                      "department": "IT | HR | Finance | null",
                      "category": "allowed category | null",
                      "priority": "low | normal | high",
                      "summary": "short summary",
                      "needsReview": false
                    }
                    `
                },
                {
                    role: 'user',
                    content: text
                },
            ],
        });
        const content = response.choices[0]?.message?.content;
        if (!content){
            throw new Error('OpenRouter returned an empty response');
        }
        const cleanedContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonStart = cleanedContent.indexOf('{');
        const jsonEnd = cleanedContent.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1){
            throw new Error('OpenRouter returned a non-JSON response');
        }
        const jsonText = cleanedContent.slice(jsonStart, jsonEnd + 1);
        return JSON.parse(jsonText) as IntakeResultDto;
    }
}