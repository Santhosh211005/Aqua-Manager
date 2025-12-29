# Aqua Manager

Aqua Manager is a smart water delivery and billing portal built with React, TypeScript, Tailwind CSS, and Google Gemini AI.

## 📂 Folder Structure

Ensure your local project matches this structure:

```
aqua-manager/
├── index.html           # Entry HTML file
├── index.tsx            # Entry React file
├── App.tsx              # Main Application Component
├── types.ts             # TypeScript Interfaces
├── package.json         # Dependencies and Scripts
├── tsconfig.json        # TypeScript Configuration
├── vite.config.ts       # Vite Configuration
├── tailwind.config.js   # Tailwind Configuration
├── postcss.config.js    # PostCSS Configuration
├── manifest.json        # PWA Manifest
├── components/          # UI Components
│   ├── Layout.tsx
│   ├── Dashboard.tsx
│   ├── CustomerList.tsx
│   ├── DeliveryLog.tsx
│   ├── Billing.tsx
│   ├── Reports.tsx
│   └── AIAssistant.tsx
└── services/            # Business Logic & API
    ├── storageService.ts
    └── geminiService.ts
```

## 🚀 Getting Started

1.  **Install Node.js**: Ensure you have Node.js installed on your machine.
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Set API Key**:
    Create a `.env` file in the root directory and add your Google Gemini API key:
    ```env
    VITE_GEMINI_API_KEY=your_api_key_here
    ```
    *Note: You may need to update `services/geminiService.ts` to use `import.meta.env.VITE_GEMINI_API_KEY` if running in Vite locally.*

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
5.  **Build for Production**:
    ```bash
    npm run build
    ```

## 📱 Features

*   **Dashboard**: Real-time stats on deliveries and revenue.
*   **Customer Management**: Add, edit, and track customers.
*   **Delivery Log**: Quick logging of daily deliveries.
*   **Billing**: Record payments (Cash/UPI) and track balances.
*   **Reports**: Visual charts and data export (CSV/JSON).
*   **AI Assistant**: Smart insights and message drafting using Google Gemini.
*   **PWA Support**: Installable on mobile devices.
