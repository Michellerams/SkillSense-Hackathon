import { GoogleGenAI, Type } from '@google/genai';
import { DataSource, LearningResource, Skill, SuggestedSkill, SkillExtractionResponse, FutureSkill } from '../types';

// Initialize the GoogleGenAI client with the API key from environment variables.
// This is the standard and secure way to configure the SDK.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Defines the JSON schema for a single skill object.
 * This schema is used to instruct the AI to return data in a structured format,
 * ensuring type safety and predictability in the response.
 */
const skillSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: 'The name of the skill' },
    category: {
      type: Type.STRING,
      enum: ['Technical', 'Soft Skill', 'Leadership', 'Language', 'Other'],
      description: 'The category of the skill',
    },
    confidence: {
      type: Type.NUMBER,
      description: 'Confidence score from 1-100 on whether the person has this skill.',
    },
    evidence: {
      type: Type.STRING,
      description: 'A direct quote or concise summary from the source text as evidence',
    },
    type: {
      type: Type.STRING,
      enum: ['Explicit', 'Implicit'],
      description: 'Indicates if the skill was explicitly stated or inferred implicitly from context.',
    },
  },
  required: ['name', 'category', 'confidence', 'evidence', 'type'],
};

/**
 * Defines the JSON schema for a suggested skill.
 */
const suggestedSkillSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: 'The name of the suggested skill' },
    category: {
      type: Type.STRING,
      enum: ['Technical', 'Soft Skill', 'Leadership', 'Language', 'Other'],
      description: 'The category of the skill',
    },
    reasoning: {
      type: Type.STRING,
      description: 'A concise reason why this skill is a good suggestion for the user based on their current profile.',
    },
  },
  required: ['name', 'category', 'reasoning'],
};

/**
 * Defines the JSON schema for a learning resource.
 */
const learningResourceSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: 'The title of the course, book, or certification.' },
        platform: { type: Type.STRING, description: 'The platform offering the resource (e.g., Coursera, Udemy, Pluralsight, a publisher).' },
        type: {
            type: Type.STRING,
            enum: ['Course', 'Certification', 'Book', 'Article'],
            description: 'The type of learning resource.'
        },
        url: { type: Type.STRING, description: 'A plausible, illustrative URL for the resource. This does not need to be a real, working link.' },
    },
    required: ['title', 'platform', 'type', 'url'],
};

/**
 * Defines the JSON schema for a single future skill object.
 */
const futureSkillSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: 'The name of the forecasted skill.' },
    category: {
      type: Type.STRING,
      enum: ['Technical', 'Soft Skill', 'Leadership', 'Language', 'Other'],
      description: 'The category of the skill.',
    },
    trend: {
      type: Type.STRING,
      enum: ['Emerging', 'Growing', 'Transformative'],
      description: 'The nature of the skill\'s trend in the industry.'
    },
    reasoning: { type: Type.STRING, description: 'A concise, data-driven reason why this skill is relevant to the user\'s current profile and future career trajectory.' },
    impact: { type: Type.STRING, description: 'A brief description of the potential positive impact this skill could have on the user\'s career.' },
  },
  required: ['name', 'category', 'trend', 'reasoning', 'impact'],
};

/**
 * Extracts a list of skills from various data sources using a generative AI model.
 * It performs a deep semantic analysis to identify both explicit and implicit skills.
 * @param dataSources - An array of data sources, which can be text or files (PDF, DOCX).
 * @returns A promise that resolves to an object containing the skills and a summary.
 * @throws An error if the API call fails or the response is invalid.
 */
export const extractSkillsFromData = async (dataSources: DataSource[]): Promise<SkillExtractionResponse> => {
  const textParts: string[] = [];
  const fileParts: ({ inlineData: { mimeType: string; data: string; } })[] = [];
  const supportedFileTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  // Process and segregate data sources into text and file parts for the API request.
  for (const ds of dataSources) {
    if (ds.mimeType.startsWith('text/')) {
      textParts.push(`--- Document: ${ds.name} ---\n${ds.content}`);
    } else if (supportedFileTypes.includes(ds.mimeType)) {
      fileParts.push({
        inlineData: {
          mimeType: ds.mimeType,
          data: ds.content,
        },
      });
      textParts.push(`--- Document: ${ds.name} --- (Content is in the attached file)`);
    }
  }

  const aggregatedTextContent = textParts.join('\n\n');

  // This is a highly detailed prompt engineered for accuracy and unbiased analysis.
  const prompt = `
    You are an intelligent assistant designed to extract and validate skills from a person's public digital footprint. The user has provided content which may include text, uploaded documents, and links to their GitHub, LinkedIn, or personal portfolio.

    Follow these steps meticulously:
    1.  **Content Retrieval & Analysis**: Access and parse the content of all provided sources. If URLs are provided, you MUST use your search tool to retrieve the content from those pages.
        -   **For GitHub**: Extract repository names, descriptions, README files, languages used, and relevant commit messages.
        -   **For LinkedIn**: Extract job titles, job descriptions, the dedicated skills section, endorsements, and listed projects.
        -   **For Portfolio/Websites**: Extract project descriptions, blog post content related to professional skills, and any explicitly listed skills.

    2.  **Skill Extraction**: Perform a deep semantic analysis to identify both EXPLICIT and IMPLICIT skills.
        -   **Explicit Skills**: These are skills directly stated, such as "Proficient in Python" or listed in a dedicated 'Skills' section.
        -   **Implicit Skills**: These are skills inferred from context, responsibilities, project descriptions, and achievements. For example, describing the management of a project implies "Project Management" and "Leadership".

    3.  **Confidence Scoring & Evidence**: For each skill, provide a confidence score from 1-100 and a traceable evidence snippet from the source material.

    4.  **Hallucination Filtering & Bias Removal**:
        -   **CRITICAL**: You must remove any skills not supported by direct evidence from the provided sources. Do not infer skills unless the context is strong and traceable. Prioritize precision over recall.
        -   Your analysis must be completely objective and free of bias. Do NOT make assumptions based on names, pronouns, or any other demographic information. Focus exclusively on the professional qualifications documented.

    **Output Format:**
    You MUST return a single, valid JSON object with two keys: "summary" and "skills". Do NOT wrap the JSON in markdown backticks like \`\`\`json ... \`\`\`.
    -   "summary": A concise, professional summary (3-4 paragraphs) of the person's profile based on the extracted skills, written in the first person.
    -   "skills": An array of skill objects. Each skill object MUST have the following properties:
        - "name": (string) The name of the skill.
        - "category": (string) One of: 'Technical', 'Soft Skill', 'Leadership', 'Language', 'Other'.
        - "confidence": (number) A score from 1-100.
        - "evidence": (string) A direct quote or concise summary from the source text as evidence.
        - "type": (string) One of: 'Explicit', 'Implicit'.

    Here is the aggregated user content to analyze:
    ${aggregatedTextContent}
  `;
  
  const contentParts = [{ text: prompt }, ...fileParts];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: { parts: contentParts },
      config: {
        // responseMimeType and responseSchema are not allowed when using the googleSearch tool.
        tools: [{ googleSearch: {} }], // Enable web search for URLs
      },
    });

    const rawText = response.text.trim();
    // Clean potential markdown formatting from the response, as the model might still add it.
    const jsonText = rawText.replace(/^```json\s*/, '').replace(/```$/, '');
    return JSON.parse(jsonText) as SkillExtractionResponse;
  } catch (error) {
    console.error('Error extracting skills:', error);
    throw new Error('Failed to analyze skills. The AI may be busy or the input data could be invalid.');
  }
};

/**
 * Generates a professional summary based on a list of skills.
 * @param skills - An array of Skill objects.
 * @returns A promise that resolves to a string containing the professional summary.
 */
export const summarizeSkills = async (skills: Skill[]): Promise<string> => {
    const skillsJson = JSON.stringify(skills, null, 2);
    const prompt = `
        You are a professional career coach and expert resume writer. Based on the following JSON list of a person's skills, write a concise and professional summary of their profile. 
        
        The summary should:
        - Be written in the first-person.
        - Start with a powerful opening statement.
        - Highlight their key strengths and core competencies, grouping related skills.
        - Mention both technical and soft skills to present a well-rounded individual.
        - Be suitable for an executive overview or a LinkedIn "About" section.
        - Be approximately 3-4 paragraphs long.
        - **Ensure the summary is free of any bias and reflects only the provided skills.**

        Here is the list of skills:
        ${skillsJson}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error('Error summarizing skills:', error);
        throw new Error('Failed to generate summary.');
    }
};

/**
 * Extracts required skills from a job posting.
 * @param jobDescription - A string containing the full job description.
 * @returns A promise that resolves to an array of identified Skill objects required for the job.
 */
export const extractSkillsFromJobPosting = async (jobDescription: string): Promise<Skill[]> => {
  const prompt = `
    You are an expert HR and recruitment analyst. Your task is to analyze the provided job description and extract a comprehensive list of required skills.

    For each identified skill, you must provide:
    1.  \`name\`: The name of the skill (e.g., "React.js", "Project Management", "Public Speaking").
    2.  \`category\`: Categorize the skill into one of: "Technical", "Soft Skill", "Leadership", "Language", or "Other".
    3.  \`confidence\`: A score from 1 to 100 representing your assessment of how critical this skill is for the role based on the job description. A higher score means more critical.
    4.  \`evidence\`: A short, direct quote from the job description that serves as evidence for this skill.
    5.  \`type\`: Classify the skill as either "Explicit" (directly mentioned) or "Implicit" (inferred from responsibilities like "collaborate with teams" implies "Teamwork").

    **Crucially, your analysis must be completely objective and unbiased. Focus only on the professional requirements outlined in the text.**

    Here is the job description:
    ${jobDescription}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: { parts: [{ text: prompt }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: skillSchema,
        },
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as Skill[];
  } catch (error) {
    console.error('Error extracting job skills:', error);
    throw new Error('Failed to analyze job description. The API may be busy or the input data could be invalid.');
  }
};

/**
 * Generates a concise summary of the skill gap between a user and a job.
 * @param userSkills - An array of the user's skills.
 * @param jobSkills - An array of the skills required for the job.
 * @returns A promise that resolves to a string containing the skill gap summary.
 */
export const generateSkillGapSummary = async (userSkills: Skill[], jobSkills: Skill[]): Promise<string> => {
    const userSkillsJson = JSON.stringify(userSkills.map(s => s.name), null, 2);
    const jobSkillsJson = JSON.stringify(jobSkills.map(s => ({ name: s.name, confidence: s.confidence })), null, 2);

    const prompt = `
        You are an expert career coach providing a concise analysis of a candidate's skill fit for a job.
        
        You will be given two JSON objects:
        1.  A list of the candidate's existing skills.
        2.  A list of skills required for a job, including a 'confidence' score which indicates how critical the skill is for the role (1-100).

        Based on this data, provide an extremely concise, professional summary in one single paragraph.
        
        **Instructions:**
        - Start with a clear, overall assessment of the candidate's fit.
        - Briefly highlight the strongest matches and most critical gaps.
        - Conclude with a positive, encouraging statement.
        - **Your analysis must be objective and unbiased.**
        - **Crucially, do not use any markdown formatting. No asterisks, no bolding, no lists. Just a single block of plain text.**

        **Candidate's Skills:**
        ${userSkillsJson}

        **Job's Required Skills (with criticality score):**
        ${jobSkillsJson}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error('Error generating skill gap summary:', error);
        throw new Error('Failed to generate skill gap summary.');
    }
};

/**
 * Generates a CV in Markdown format based on a user's skills and summary.
 * @param skills - An array of the user's skills.
 * @param summary - A professional summary string.
 * @returns A promise that resolves to a string containing the CV in Markdown format.
 */
export const generateCVFromSkills = async (skills: Skill[], summary: string): Promise<string> => {
    const skillsJson = JSON.stringify(skills, null, 2);
    const prompt = `
        You are an expert professional resume writer. Based on the provided personal summary and a JSON list of skills, generate a professional CV in Markdown format.

        The CV should be well-structured and include the following sections:
        1.  **Summary**: Use the provided summary text directly for this section.
        2.  **Core Competencies**: Create a bulleted list of the most important skills, drawing from the entire skill list.
        3.  **Technical Skills**: Group and list skills categorized as 'Technical'. You can create sub-categories if it makes sense (e.g., Programming Languages, Frameworks, Databases).
        4.  **Professional Skills**: Group and list skills from 'Soft Skill', 'Leadership', and other relevant categories here.

        **Instructions:**
        - Format the output exclusively in Markdown. Use headings, bold text, and bullet points for clarity.
        - Do not invent any information, such as work experience, education, or contact details. Only use the provided summary and skills list.
        - Ensure the tone is professional and impactful.

        **Personal Summary:**
        ${summary}

        **Skills List (JSON):**
        ${skillsJson}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error('Error generating CV:', error);
        throw new Error('Failed to generate CV.');
    }
};

/**
 * Suggests new skills for a user to learn based on their existing skillset.
 * @param skills - An array of the user's current skills.
 * @returns A promise that resolves to an array of SuggestedSkill objects.
 */
export const suggestNewSkills = async (skills: Skill[]): Promise<SuggestedSkill[]> => {
  const skillsJson = JSON.stringify(skills.map(s => ({ name: s.name, category: s.category })), null, 2);
  const prompt = `
    You are an expert career development coach. Based on the following list of a person's existing skills, suggest 3-5 new skills they could learn to enhance their career profile.

    **Instructions:**
    - Analyze the existing skill set to understand the person's current areas of expertise.
    - Suggest skills that are complementary, represent a logical next step, or open up new career paths. For example, if they know React, suggest Next.js. If they have project management skills, suggest Agile or Scrum Master certification.
    - For each suggestion, provide a concise \`reasoning\` for why it's a valuable addition.

    **Existing Skills:**
    ${skillsJson}

    Return a list of suggested skills.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: suggestedSkillSchema,
        },
      },
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as SuggestedSkill[];
  } catch (error) {
    console.error('Error suggesting new skills:', error);
    throw new Error('Failed to generate skill suggestions.');
  }
};

/**
 * Fetches a list of learning resources for a specific skill.
 * @param skillName - The name of the skill to find resources for.
 * @returns A promise that resolves to an array of LearningResource objects.
 */
export const getLearningResources = async (skillName: string): Promise<LearningResource[]> => {
  const prompt = `
    You are a helpful learning assistant. For the skill "${skillName}", provide a list of 3-4 diverse learning resources.

    **Instructions:**
    - Include a mix of resource types like 'Course', 'Certification', 'Book', and 'Article'.
    - For courses and certifications, list well-known platforms like Coursera, Udemy, Pluralsight, or official documentation sites.
    - For each resource, generate a plausible, illustrative URL. These do not need to be real, working links but should look realistic (e.g., "https://www.coursera.org/learn/advanced-react").
    - Ensure the resources are relevant and high-quality suggestions for someone looking to learn "${skillName}".

    Return a list of learning resources.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: learningResourceSchema,
        },
      },
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as LearningResource[];
  } catch (error)
 {
    console.error('Error fetching learning resources:', error);
    throw new Error(`Failed to find learning resources for ${skillName}.`);
  }
};

/**
 * Forecasts future skills based on the user's current profile.
 * @param skills - An array of the user's current skills.
 * @returns A promise that resolves to an array of FutureSkill objects.
 */
export const forecastFutureSkills = async (skills: Skill[]): Promise<FutureSkill[]> => {
  const skillsJson = JSON.stringify(skills.map(s => ({ name: s.name, category: s.category })), null, 2);
  const prompt = `
    You are a futurist and senior industry analyst with deep knowledge of technological and business trends. Your task is to analyze a user's current skill profile and forecast 3-4 emerging or rapidly growing skills that would be most valuable for their career advancement.

    **Analysis Criteria:**
    1.  **Relevance**: The forecasted skills must be logically connected to the user's existing skill set.
    2.  **Future-Proofing**: Prioritize skills that are part of major industry trends (e.g., AI/ML, cybersecurity, sustainable tech, data science).
    3.  **Actionability**: The skills should be learnable and have a clear career impact.

    **User's Current Skills:**
    ${skillsJson}

    Based on this profile, provide your forecast. For each skill, you MUST provide:
    - \`name\`: The name of the skill.
    - \`category\`: The skill's category.
    - \`trend\`: Classify the trend as 'Emerging', 'Growing', or 'Transformative'.
    - \`reasoning\`: A concise, data-driven explanation for why this skill is a crucial next step for this specific user.
    - \`impact\`: A brief description of the potential positive impact this skill could have on their career path (e.g., "Opens opportunities in AI-driven product management," "Positions you for senior roles in cloud architecture.").

    Return a valid JSON array of forecasted skills.
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: futureSkillSchema,
        },
      },
    });
    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as FutureSkill[];
  } catch (error) {
    console.error('Error forecasting future skills:', error);
    throw new Error('Failed to forecast future skills. The AI oracle is contemplating.');
  }
};