
import { streamText, UIMessage, convertToModelMessages, stepCountIs, createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import { MODEL, MODERATION_DENIAL_MESSAGE } from '@/config';
import { SYSTEM_PROMPT } from '@/prompts';
import { isContentFlagged } from '@/lib/moderation';
import { webSearch } from './tools/web-search';
import { readNotebookLecture } from './tools/read-notebook-lecture';
import { readSlideLecture } from './tools/read-slide-lecture';
import { readSyllabus } from './tools/read-syllabus';
import { readAssignment } from './tools/read-assignment';
import { readAssignedReading } from './tools/read-assigned-reading';
import { vectorDatabaseSearch } from './tools/search-vector-database';

export const maxDuration = 30;
export async function POST(req: Request) {
@@ -69,22 +65,18 @@
        messages: convertToModelMessages(messages),
        tools: {
            webSearch,
            readNotebookLecture,
            readSlideLecture,
            readSyllabus,
            readAssignment,
            readAssignedReading,
            vectorDatabaseSearch,
        },
        stopWhen: stepCountIs(10),
        providerOptions: {
            openai: {
                reasoningSummary: 'auto',
                reasoningEffort: 'low',
                parallelToolCalls: false,
            }
        }
    });

    return result.toUIMessageStreamResponse({
        sendReasoning: true,
    });
