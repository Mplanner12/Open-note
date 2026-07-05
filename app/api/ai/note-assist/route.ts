import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { action, content, language } = await req.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required for AI actions' }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;

    let prompt = '';
    if (action === 'suggest-tags') {
      prompt = `You are a professional assistant. Analyze this note content and recommend 3 to 5 simple, relevant tags (e.g. "Ideas", "Marketing", "Feature", "Refactor", "Design"). Return ONLY a raw JSON string array like ["Tag1", "Tag2", "Tag3"]. No other text, no markdown formatting, no code blocks, no prefix.
      
      Content: ${content.substring(0, 3000)}`;
    } else if (action === 'summarize') {
      prompt = `Provide a concise, professional bulleted summary / TL;DR of this note. Use markdown formatting:
      
      Content: ${content}`;
    } else if (action === 'autocomplete') {
      prompt = `Continue the following text with one or two natural, concise sentences that logically follow. Return only the continuation — do not repeat any of the input text, do not add headings or bullet points:\n\n${content}`;
    } else if (action === 'translate') {
      const langMap: Record<string, string> = {
        ar: 'Arabic', az: 'Azerbaijani', es: 'Spanish',
        fr: 'French', de: 'German', zh: 'Chinese', ja: 'Japanese',
      };
      const targetLang = langMap[language ?? ''] ?? 'English';
      prompt = `Translate the following text into ${targetLang}. Return ONLY the translation, no explanation or introductory text:\n\nText: ${content}`;
    } else if (action === 'polish') {
      prompt = `Format and polish the following raw notes into a professional, well-structured document using clean markdown layout (headers, bullet points, next steps). Provide only the markdown content, no extra talk:\n\nDetails: ${content}`;
    } else if (action === 'polish-selection') {
      prompt = `Improve the spelling, grammar, flow, and tone of the following highlighted text. Keep the response concise and maintain the original paragraph/sentence structure. Do NOT add headings, markdown titles (#), tags, next steps, or bullet points unless they were already present. Return ONLY the polished text, with no introductory or meta text:\n\nText: ${content}`;
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Attempt Groq API connection
    if (groqKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.3,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const resData = await response.json();
          let resultText = resData.choices[0]?.message?.content || '';

          if (action === 'suggest-tags') {
            resultText = resultText.trim();
            if (resultText.startsWith('```json')) {
              resultText = resultText.substring(7, resultText.length - 3).trim();
            } else if (resultText.startsWith('```')) {
              resultText = resultText.substring(3, resultText.length - 3).trim();
            }
          }

          return NextResponse.json({ result: resultText });
        } else {
          console.warn(`Groq API returned error status: ${response.status}. Using mock sandbox fallback.`);
        }
      } catch (err) {
        console.warn('Groq API connection timeout or network failure. Using mock sandbox fallback.', err);
      }
    } else {
      console.warn('GROQ_API_KEY is not configured. Using mock sandbox fallback.');
    }

    // Mock Fallback responses (only triggered if Groq key is missing or connection fails/times out)
    let mockResult = '';
    if (action === 'suggest-tags') {
      const generalTags = ['Ideas', 'Feature', 'Refactor', 'Draft', 'Meeting', 'Task', 'Design', 'Research'];
      const numTags = 3 + Math.floor(Math.random() * 3);
      const tags = [...generalTags].sort(() => 0.5 - Math.random()).slice(0, numTags);
      return NextResponse.json({ result: JSON.stringify(tags) });
    } else if (action === 'summarize') {
      mockResult = `**Key Takeaways (TL;DR):**
• Draft concerns core feature requirements or notes.
• Essential objectives are outlined for collaboration.
• Next steps and action items are flagged.
• Document updated with design suggestions.`;
    } else if (action === 'autocomplete') {
      mockResult = `\n\nAdditionally, the team discussed setting up a roadmap review meeting next Monday. We should review initial prototypes, gather feedback from stakeholders, and lock down the launch timeline. Please document any updates in the shared workspace.`;
    } else if (action === 'translate') {
      const lang = language || 'ar';
      if (lang === 'ar') {
        mockResult = `[ترجمة آليّة] تم حفظ وتحديث الملاحظات بنجاح. يرجى مراجعة المهام المتبقية والبدء في تنفيذ الخطوات التالية بالتنسيق مع الفريق.`;
      } else if (lang === 'az') {
        mockResult = `[Avtomatik tərcümə] Qeydlər uğurla yadda saxlanıldı və yeniləndi. Zəhmət olmasa qalan tapşırıqlara nəzər salın və növbəti addımları komanda ilə əlaqəli şəkildə yerinə yetirin.`;
      } else {
        mockResult = `[Automatic Translation] Notes successfully saved and updated. Please review the remaining tasks and initiate the next steps in coordination with the team.`;
      }
    } else if (action === 'polish') {
      mockResult = `# Meeting & Brainstorm Notes

## Overview
Brief summary of the thoughts and initial draft content provided.

## Core Concepts
- **Focus Area:** Primary subject identified in the note body.
- **Objectives:** Targeted milestones.

## Next Steps
1. Review implementation details with team members.
2. Outline specific tasks in the sprint plan.
3. Schedule a follow-up review session.`;
    } else {
      mockResult = `Processed content: ${content}`;
    }

    return NextResponse.json({ result: mockResult });

  } catch (error: unknown) {
    console.error('AI Note Assist Error:', error);
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 });
  }
}
