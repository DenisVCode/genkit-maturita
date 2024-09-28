import * as z from "zod";
import { configureGenkit } from "@genkit-ai/core";
import { defineFlow, startFlowsServer } from "@genkit-ai/flow";
import { vertexAI } from "@genkit-ai/vertexai";
import { dotprompt, promptRef } from "@genkit-ai/dotprompt";

configureGenkit({
  plugins: [
    // Load the Vertex AI plugin. You can optionally specify your project ID
    // by passing in a config object; if you don't, the Vertex AI plugin uses
    // the value from the GCLOUD_PROJECT environment variable.
    vertexAI({ location: "us-central1" }),
    dotprompt(),
  ],
  logLevel: "debug",
  enableTracingAndMetrics: true,
});

const physicsPrompt = promptRef("physics");
const spokenTextPrompt = promptRef("spoken_text");

export const studentAnswerFlow = defineFlow(
  {
    name: "studentAnswerFlow",
    inputSchema: z.object({
      question: z.string(),
      convertToSpokenText: z.boolean(),
    }),
    outputSchema: z.object({
      answer: z.string(),
      spokenAnswer: z.string().optional(),
    }),
  },
  async (inputs) => {
    const answerResponse = await physicsPrompt.generate({
      input: {
        question: inputs.question,
      },
    });

    // If we don't need spoken answer, return only the written answer
    if (!inputs?.convertToSpokenText) {
      return {
        answer: answerResponse.text(),
      };
    }

    const spokenAnswerResponse = await spokenTextPrompt.generate({
      input: {
        writtenText: answerResponse.text(),
      },
    });

    return {
      answer: answerResponse.text(),
      spokenAnswer: spokenAnswerResponse.text(),
    };
  }
);

startFlowsServer();
