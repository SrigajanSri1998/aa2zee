# A2Z to 3PL Biz Web Connect (`3pl.aa2zee.com`)

This repository now contains a **local 3-tier starter implementation** for the requested 3PL visitor onboarding flow:

- **UI** (`/ui`): Landing page with Header, Flash section, Body Box 1, Body Box 2, Body Box 3 (form)
- **API** (`/api`): REST endpoints for business-account creation, retrieval, and updates
- **DB** (`/db`): SQLite database file created at runtime (`db/aa2zee.sqlite`)

## Implemented Scope

### 1) Header
Top navigation and CTA for 3PL visitor account onboarding.

### 2) Flash Section
Intro message adapted from "A2Z to 3PL Biz-g1- INTRO Email and 3pl Info Collection" content.

### 3) Body Box-1 (A2Z Overview, Orders, Storage, Requirement)
Structured presentation of the Attachment-1 business overview, weekly order volume, technical/service requirements, and product packaging profile.

### 4) Body Box-2 (Answers to 3PL Concerns)
Q&A table from Attachment-2 with responses for product type, labeling, barcoding, SKU volume, docs/alerts, shipping methods, returns, integrations, and special instructions.

### 5) Body Box-3 (3PL Form)
Form supports entry for:
- Company info
- Key contact
- Warehouse and dock availability
- FBM, PNP, VAS details
- B2B operations support
- POD/POR scan capability
- 24x7 web access
- Full-service rate list rows
- Optional rate list file upload

### 6) Visitor Account Data Actions (VIEW/EDIT)
After form submit:
- Visitor account is created in DB through API
- Existing records can be loaded by Account ID
- Loaded records can be edited and updated

## Project Structure

```
.
├── api/
│   ├── package.json
│   └── server.js
├── db/
│   └── .gitkeep
├── ui/
│   ├── app.js
│   ├── index.html
│   └── styles.css
└── README.md
```

## Run Locally

### Prerequisites
- Node.js 18+

### Install API dependencies
```bash
cd api
npm install
```

### Start API server
```bash
npm start
```

Server runs at `http://localhost:4000`.

### Open UI
Open `ui/index.html` directly in browser, or serve it using any static server.

If opening directly from file path, the page is preconfigured to call API at `http://localhost:4000`.

## API Endpoints

- `POST /api/accounts` — Create new 3PL business account (multipart form; optional file upload)
- `GET /api/accounts/:id` — View account by id
- `PUT /api/accounts/:id` — Edit/update account by id (multipart form; optional file re-upload)
- `GET /api/health` — Health check

## Notes

- Uploaded rate-list files are stored in `api/uploads/`.
- Rate rows are persisted as JSON in SQLite.
- This is a starter build intended for localhost development and demo.
