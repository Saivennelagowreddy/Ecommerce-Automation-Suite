import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add material icons for UI elements
const materialIconsLink = document.createElement('link');
materialIconsLink.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
materialIconsLink.rel = "stylesheet";
document.head.appendChild(materialIconsLink);

// Add Roboto font for material design style
const robotoFontLink = document.createElement('link');
robotoFontLink.href = "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap";
robotoFontLink.rel = "stylesheet";
document.head.appendChild(robotoFontLink);

// Add page title
const titleElement = document.createElement('title');
titleElement.textContent = "E-Commerce Automation Suite";
document.head.appendChild(titleElement);

createRoot(document.getElementById("root")!).render(<App />);
