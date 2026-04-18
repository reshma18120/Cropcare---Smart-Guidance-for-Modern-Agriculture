🌱 CropCare AI System
CropCare AI is an intelligent agriculture support system that integrates Machine Learning, Deep Learning, and Generative AI to assist farmers with crop recommendations, disease detection, price prediction, and smart insights.

📌 Features
🌾 Crop Recommendation (Random Forest)
🦠 Disease Detection (CNN Model)
📈 Market Price Prediction (XGBoost)
🤖 AI Assistant (LangChain + Gemini API)
📊 Analytics & Insights
🌦️ Real-time Weather Dashboard
📱 OTP-based Authentication (Node.js + Twilio)
🛠️ Tech Stack

Backend
FastAPI
Uvicorn
Scikit-learn
TensorFlow / Keras
Pandas, NumPy
FAISS (Vector DB)
LangChain + Gemini API
Frontend
React (Vite)
Other Tools
Node.js (OTP Authentication)
Twilio API

⚙️ Prerequisites

Ensure the following are installed:

Python 3.10+
Node.js (LTS)
npm
VS Code (recommended)

Verify installations:

python --version
node --version
npm --version
📦 Installation
1. Clone the Repository
git clone <your-repo-url>
cd CropCare
2. Backend Setup
cd backend

python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
3. Frontend Setup
cd ..
npm install

🔐 Environment Configuration

Create a .env file inside the backend folder:

GEMINI_API_KEY=your_api_key_here
🧠 Model & Database Initialization
Build Vector Database (FAISS)
python build_all_dbs.py
Train Models (if not pre-trained)
python train_crop_model.py
python train_price_model.py

Generated files:

crop_model.pkl
price_model.pkl
🚀 Running the Application
Step 1: Start Backend
cd backend
venv\Scripts\activate

uvicorn app:app --reload

Backend runs at:

http://127.0.0.1:8000
Step 2: Start Frontend
npm run dev

Frontend runs at:

http://localhost:5000
Step 3: Open Application

Open in browser:

http://localhost:5000

🔑 Authentication
Enter mobile number
Receive OTP via Twilio
Verify and login
📊 Dashboard Features
Temperature, Humidity, Rainfall, Wind Speed
Daily Farming Tips
Navigation to all modules
🧩 Core Modules
🌾 Crop Recommendation
Input: Region
Uses: Soil + Weather + Season
Output:
Recommended crop
Confidence score
Top 3 crops
🦠 Disease Detection
Input: Leaf Image
Model: CNN
Output:
Disease name
Remedies
📈 Market Price Prediction
Input: Crop, State, Market, Date
Model: XGBoost
Output:
Predicted price
Trend analysis
🤖 AI Assistant
Input: Text/Voice query
Tech: Gemini API + LangChain
Output:
Smart farming guidance
📊 Analytics
Input: Region, Year
Output:
Graphs
Trends
Insights
🔄 System Workflow
User logs in via OTP
Access dashboard
Select module
Provide input
Backend processes using ML/DL/AI
Results generated
Analytics processed
Dashboard displays insights
⚠️ Common Errors & Fixes
Dependency Issues
pip install -r requirements.txt
FAISS Installation Error
pip install faiss-cpu
API Key Issues
Ensure .env file exists
Verify Gemini API key
Frontend Not Connecting
Check backend is running at:
http://127.0.0.1:8000
📌 Final Execution Summary
Backend
cd backend
venv\Scripts\activate
pip install -r requirements.txt
python build_all_dbs.py
uvicorn app:app --reload
Frontend
npm install
npm run dev
📖 Conclusion

CropCare AI is a scalable and modular system that leverages AI, ML, and modern web technologies to deliver real-time, data-driven agricultural insights and decision support.