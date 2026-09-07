import "dotenv/config";
import { runSeed } from "./seed";
import { initDb } from "./index";

initDb()
  .then(() => runSeed())
  .then((did) => {
    console.log(did ? "Database seeded." : "Database already seeded — skipped.");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
