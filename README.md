## 📘 **Overview** 
**CivicBuddy** is a full-stack AI-powered civic assistant that empowers citizens to seamlessly report, track, and follow up on municipal issues such as potholes, water supply failures, garbage accumulation, and streetlight outages. With an intuitive web interface, image recognition capabilities, natural language understanding, and backend integration with municipal systems, CivicBuddy streamlines civic grievance redressal into an intelligent, automated workflow. 

At its core, CivicBuddy exemplifies the use of Azure OpenAI services, Azure Computer Vision, React Native Web, Express.js, Prisma ORM, and a PostgreSQL database—all built and deployed with strong engineering best practices. 
## 🧠 **Project Premise and Creativity** 
CivicBuddy addresses a **real-world, high-impact problem**: the friction and opacity citizens face in reporting everyday civic issues. Traditional complaint systems are manual, bureaucratic, and offer poor feedback loops. CivicBuddy introduces **AI automation and user-friendly design** to fundamentally reinvent this interaction. The project is **creative not only in how it leverages AI for classification and follow-up automation** but also in how it integrates geolocation, dynamic form interaction, and visual context (images) into a seamless conversational flow. 
## 🔍 **Key Features & Technologies** 
#### 💬 **Conversational Complaint Assistant** 
- Utilizes **Azure OpenAI GPT-4** via **Prompt Flow** to interpret natural language complaints and route them to the appropriate municipal department. 
- Auto-generates structured complaints including inferred department, issue description, and location context. 

🖼 **Visual Complaint Detection** 

- Users can upload an image of a civic issue. 
- Azure **Computer Vision API** analyzes the image and detects probable civic issues (e.g. potholes, garbage). 
- The bot prompts users for confirmation, additional context, and location edits before registering the complaint. 
#### 📍 **Smart Location Integration** 
- Uses **Expo Location + Maps API** to detect user location and convert it to a readable address. 
- Provides dynamic control to confirm or override the address for accurate grievance reporting. 
#### 📧 **Automated Follow-Ups** 
- A **Human-in-the-Loop** mechanism lets users initiate follow-up emails after 24 hours, complete with templated content. 
- The follow-up capability is dynamically toggled, giving a controlled and best experience. 
#### ✅ **Responsible AI Design** 
- Prevents unintended automated actions through confirmation prompts ("Do you want to continue?" , “Do you want to continue with current location address ?”) 
- Locality-based rules avoid sending grievances to unsupported city departments. 
- Supports image, text, and hybrid inputs—**inclusive and accessible** design. 
#### 🔐 **Backend Architecture** 
- Built with **Express.js**, **Prisma ORM**, and **PostgreSQL**, the backend exposes REST APIs for: 
  - Complaint registration and retrieval 
  - Image upload and classification 
  - Real-time chat history tracking per complaint 
- All data is securely stored and audit-trailed. 

## ✏️ **Architectural Diagram** 

![Image](https://github.com/user-attachments/assets/f19ed691-ae81-4d9e-b01a-713e3deabb81)

The above architectural diagram illustrates the complete workflow of the CivicBuddy AI Assistant, showcasing how user interactions flow through the system:

- Frontend Clients: Users interact via a React Native for Web interface or a PWA/mobile app.
- Backend (Node.js with Express.js): Acts as the core API layer handling all requests.
- Image & Location Analysis:
 Reverse Geocoding API extracts the user's address from coordinates.
 Uploaded images are analyzed using Azure Computer Vision via an image processing service.
- Database & ORM:
Complaint and user data are stored using PostgreSQL, interfaced through Prisma ORM.
- AI Intelligence:
Azure OpenAI’s GPT-4 (via Azure AI Studio and static city config) classifies user input into actionable civic departments and intents.
- Alerts & Follow-Ups:
Toast notifications provide real-time user feedback.
Follow-up emails are triggered using a Python-based email service connected to Azure Mail Relay.

This architecture balances intelligent automation (AI/ML), geospatial analysis, and robust full-stack engineering to deliver a seamless civic complaint reporting platform.

## 🌍 **Real-World Impact & Use Cases** 
CivicBuddy is highly **practical and scalable**: 

- **Government Municipalities** can use it as a citizen engagement layer over existing legacy portals. 
- **Smart Cities** can integrate CivicBuddy as a kiosk or mobile-first service for digital governance. 
- **Schools & Colleges** can run CivicBuddy as a civic innovation pilot, engaging students in social responsibility. 
- **Housing Societies** or **Resident Welfare Associations (RWAs)** can use it internally for facility reporting. 

## 🛠 **Technical Sophistication** 

- Uses **Azure Prompt Flow** to route unstructured text to structured department intents. 
- Embeds a **multi-turn interaction** model where the AI gathers user input before auto-filing. 
- Complaints are **persisted**, chat history is tracked per complaint, and bot replies are intelligently contextual. 
- Uses **React Native for Web** to deliver a polished, responsive UI with modular components and reusable state logic. 
- Implements a **robust codebase**: 
- All REST endpoints are cleanly abstracted 
- .env secrets, CORS security, and cloud APIs are used responsibly 
- Modularized folders and clear comments 
- Toast feedback, file input refs, and persona UI icons enhance UX 

## 🖼️ Application Preview

<img width="1440" alt="Image" src="https://github.com/user-attachments/assets/33236776-d502-4aa3-8bb3-dfa92d307d6d" />

## 🧩 **Conclusion** 
CivicBuddy is a **complete, intelligent, and production-ready civic tech solution** that elevates citizen voice through responsible AI. It showcases the power of Microsoft’s AI and cloud ecosystem, while addressing a pressing real-world scenario with elegance and utility. From visual reporting to smart routing to follow-ups, CivicBuddy is an end-to-end innovation built with purpose. 

