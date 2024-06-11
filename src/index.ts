#!/usr/bin/env node

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { program } from "commander";
import fetch from "node-fetch";
//import { WBRESULTS_URL, ARCHIVES_BASE_URL } from "./constants";

dotenv.config();

interface Options {
  year: string;
  roll?: string;
  lower?: string;
  upper?: string;
  admitCardId?: string;
  source: string;
}

const WB_BASE_URL = "https://wbresults.nic.in";
const ARCHIVES_BASE_URL = "https://resultsarchives.nic.in/";

program
  .option("-y, --year <year>", "Year of examination")
  .option("-r, --roll <roll>", "Roll number (required for 'wb' source)")
  .option("-l, --lower <lower>", "Lower limit of roll number (required for 'wb' source)")
  .option("-u, --upper <upper>", "Upper limit of roll number (required for 'wb' source)")
  .option("-a, --admitCardId <admitCardId>", "Admit card ID (required for 'cbse' source)")
  .option("-s, --source <source>", "Source of results: 'wb' or 'cbse'")
  .parse(process.argv);

const options: Options = program.opts() as Options;

if (!options.year || !options.source || 
    (options.source === 'wb' && (!options.roll || !options.lower || !options.upper)) || 
    (options.source === 'cbse' && !options.admitCardId)) {
  console.error("All the required flags (year, source, and respective source-specific parameters) are not provided.");
  process.exit(1);
}

switch(options.source) {
  case "wb": {
    const baseURL = WB_BASE_URL;
    const url = `${baseURL}/highersecondary${options.year}/wbhsresult${parseInt(options.year) % 100}.asp`;
    postResultWB(parseInt(options.year), options.roll!, parseInt(options.lower!), parseInt(options.upper!), url, baseURL);
    break;
  }
  case "cbse": {
    const baseURL = ARCHIVES_BASE_URL;
    const url = `${baseURL}/cbse${options.year}/ScoreCard12th/12thMainL3`;
    postResultArchives(parseInt(options.year), options.admitCardId!, url, baseURL);
    break;
  }
  default: {
    console.error("Invalid source option. Use 'wb' or 'cbse'.");
    process.exit(1);
  }
}

async function postResultWB(
  year: number,
  roll: string,
  lower: number,
  upper: number,
  url: string,
  baseURL: string
) {
  const resultDir = path.join(process.cwd(), "results");
  const marksheetDir = path.join(resultDir, `HS${year}`);

  if (fs.existsSync(marksheetDir)) {
    fs.rmSync(marksheetDir, { recursive: true });
  }

  if (!fs.existsSync(resultDir)) {
    fs.mkdirSync(resultDir, { recursive: true });
  }

  fs.mkdirSync(marksheetDir, { recursive: true });

  const headers = {
    Referer: baseURL,
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
      const filename = path.join(marksheetDir, `${roll}-${rno}.html`);
      fs.writeFileSync(filename, result);
      console.log(`Result for Roll ${roll} Number ${rno} saved to ${filename}`);
    } catch (error) {
      console.error(`Error fetching result for Roll ${roll} Number ${rno} from ${baseURL}:`, error);
    }
  }
}

async function postResultArchives(
  year: number,
  admitCardId: string,
  url: string,
  baseURL: string
) {
  const resultDir = path.join(process.cwd(), "results");
  const marksheetDir = path.join(resultDir, `HS${year}`);

  if (fs.existsSync(marksheetDir)) {
    fs.rmSync(marksheetDir, { recursive: true });
  }

  if (!fs.existsSync(resultDir)) {
    fs.mkdirSync(resultDir, { recursive: true });
  }

  fs.mkdirSync(marksheetDir, { recursive: true });

  const headers = {
    Referer: baseURL,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  const payload = new URLSearchParams({
    admitCardId: admitCardId,
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
    const filename = path.join(marksheetDir, `${admitCardId}.html`);
    fs.writeFileSync(filename, result);
    console.log(`Result for Admit Card ID ${admitCardId} saved to ${filename}`);
  } catch (error) {
    console.error(`Error fetching result for Admit Card ID ${admitCardId} from ${baseURL}:`, error);
  }
}
