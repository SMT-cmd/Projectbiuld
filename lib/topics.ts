import { sampleTopics } from "@/lib/catalog";
import { expandedTopics } from "@/lib/expanded-topics";
import { additionalTopics } from "@/lib/additional-topics";
import type { Topic } from "@/lib/topic-types";

/** All public topic ideas are curated starting points, not claims of completed research. */
export const allTopics: Topic[] = [...sampleTopics, ...expandedTopics, ...additionalTopics];
