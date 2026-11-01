// Run: npx tsx scripts/test-extract.ts            (text story)
//      npx tsx scripts/test-extract.ts photo.jpg  (photo + story)
import { readFileSync } from "node:fs";
import { generateProfile } from "../lib/llm";
import { storyMessages, photoMessages, famousMessages } from "../lib/prompts";

const story =
  "My grandma Susie loved to knit. She wore a red knitted sweater all the time, and her pecan pie was the best thing in the world. She was warm and a little bit teasing.";

async function main() {
  const photoPath = process.argv[2];
  let msgs;
  if (photoPath) {
    const b64 = readFileSync(photoPath).toString("base64");
    msgs = photoMessages("Susie", `data:image/jpeg;base64,${b64}`, story);
  } else {
    msgs = storyMessages("Susie", story);
  }
  console.time("susie");
  console.log(await generateProfile(msgs, "Susie"));
  console.timeEnd("susie");

  console.time("ada");
  const facts =
    "Ada Lovelace (1815-1852) was an English mathematician known for her work on Charles Babbage's Analytical Engine. She wrote what is considered the first algorithm intended for a machine.";
  console.log(await generateProfile(famousMessages("Ada Lovelace", facts), "Ada Lovelace"));
  console.timeEnd("ada");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
