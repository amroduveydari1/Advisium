# Advisium

**Marketing strategy and campaign planning prototype.**

Advisium turns a business goal, target market and advertising budget into a structured marketing plan. It includes a strategy dashboard, campaign draft views and downloadable client proposals.

## What it includes

- Quick setup for website, country, campaign goal and monthly budget
- Rule-based strategy generation, scoring and budget projections
- Marketing dashboard with recommendations and performance concepts
- Campaign planning and drafts
- Client proposal export to PDF

## Built with

Next.js 14, React, TypeScript, Tailwind CSS and API routes. Proposal export uses html2canvas and jsPDF.

## How it works

`Setup → Strategy API → Rule-based strategy engine → Dashboard → Campaign drafts / PDF proposal`

The strategy code lives under `src/lib/strategy/`. API routes are under `src/app/api/`; the proposal UI is in `src/app/proposal/`.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000/setup`.

## Current status

**Prototype / portfolio project.** The strategy API currently passes demo credentials to analytics and ads integration functions. Live Google Analytics and Ads account connectivity must be validated separately; this README does not claim production integration. Budget and outcome projections are assumptions-based estimates, not guarantees.

## Engineering next steps

- Validate actual account authorization and separate demo data clearly from real data
- Add unit tests for strategy scoring and budget calculations
- Strengthen request validation and failure handling
- Verify build, lint and TypeScript checks
- Add screenshots and a working demo after verification

## Author

[Amro Duveydari](https://github.com/amroduveydari1)
