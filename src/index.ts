#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { program } from "commander";

// dotenv.config();

interface Options {
  year: string;
  roll: string;
  lower: string;
  upper: string;
}

program
  .option("-y, --year <year>", "Year of examination")
  .option("-r, --roll <roll>", "Roll number")
  .option("-l, --lower <lower>", "Lower limit of rno")
  .option("-u, --upper <upper>", "Upper limit of rno")
  .parse(process.argv);

const options: Options = program.opts() as Options;
// console.log("Parsed options:", options);

Promise.resolve(options).then(({ year, roll, lower, upper }) => {
  postResult(parseInt(year), roll, parseInt(lower), parseInt(upper));
});

async function postResult(
  year: number,
  roll: string,
  lower: number,
  upper: number,
) {
  const { default: fetch } = await import("node-fetch");
  // const BASE_URL = process.env.URL;
  const BASE_URL: string = "https://wbresults.nic.in";

  if (!BASE_URL) {
    console.error("Base URL is not defined in the environment variables.");
    return;
  }

  if (!year || !roll || !lower || !upper) {
    console.log("All the flags are not provided");
    return;
  }

  const resultDir = path.join(process.cwd(), "results", `HS${year}`);

  if (fs.existsSync(resultDir)) {
    fs.rmSync(resultDir, { recursive: true });
  }

  fs.mkdirSync(resultDir, { recursive: true });

  const url = `${BASE_URL}/highersecondary${year}/wbhsresult${year % 100}.asp`;

  const headers = {
    Referer: BASE_URL,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  for (let rno = lower; rno <= upper; rno++) {
    const payload = new URLSearchParams({
      roll: roll,
      rno: String(rno),
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: payload.toString(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.text();
      const filename = path.join(resultDir, `${roll}-${rno}.html`);
      fs.writeFileSync(filename, result);
      console.log(`Result for Roll ${roll} Number ${rno} saved to ${filename}`);
    } catch (error) {
      console.error("Error:", error);
    }
  }
}
