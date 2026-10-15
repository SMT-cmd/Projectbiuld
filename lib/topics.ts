import { sampleTopics } from "@/lib/catalog";
import { expandedTopics } from "@/lib/expanded-topics";
import type { Topic } from "@/lib/topic-types";

export const allTopics: Topic[] = [...sampleTopics, ...expandedTopics];
