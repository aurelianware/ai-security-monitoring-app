# AI-Powered Security Monitoring App

A sophisticated **web-based security monitoring application** that uses AI object detection to identify and track objects in real-time video streams. Built with React, TypeScript, and TensorFlow.js, featuring advanced overlay detection and cloud synchronization.

## 🌟 Key Features

### **🎯 Advanced Object Detection**
- **COCO-SSD Model**: State-of-the-art object detection using TensorFlow.js
- **Real-time Processing**: Live object identification in video streams  
- **Multiple Object Types**: Detects people, vehicles, animals, and everyday objects
- **Confidence Scoring**: Shows detection confidence percentages
- **Visual Overlays**: Color-coded bounding boxes with labels

### **📹 Enhanced Video Recording with Overlays**
- **Overlay Recording**: Videos include detection bounding boxes and labels
- **Smart Triggering**: Automatic recording when significant objects are detected
- **Multiple Formats**: Support for WebM and MP4 video formats
- **Canvas Stream Capture**: Records video + detection overlays simultaneously
- **Background Recording**: Non-blocking video capture

### **📸 Annotated Image Capture**
- **Detection Overlays**: Images include bounding boxes and labels
- **Position Data**: Exact pixel coordinates for each detection
- **Timestamp Information**: When each detection occurred
- **High Quality**: JPEG format with configurable quality

### **🎨 Advanced Visual Indicators**
- **Color-coded Bounding Boxes**: 
  - 🔴 Red: People (high priority alerts)
  - 🟠 Orange: Vehicles (medium priority) 
  - 🟢 Green: Other objects (low priority)
- **Detection Labels**: Object type and confidence percentage
- **Position Coordinates**: Exact location information
- **Alert Levels**: Visual priority indicators with corner markers

### **💾 Robust Storage & Sync System**
- **IndexedDB Storage**: Fast local data persistence with proper initialization
- **Blob Management**: Efficient image/video storage and retrieval
- **Azure Cloud Sync**: Background synchronization with queue management
- **Offline Support**: Full functionality without internet connection
- **Database Initialization**: Proper timing to prevent race conditions

### **⚙️ Comprehensive Settings**
- **Detection Thresholds**: Adjustable sensitivity controls
- **Recording Configuration**: Duration, format, and quality settings
- **Storage Management**: Automatic cleanup and retention policies
- **Cloud Integration**: Azure Blob Storage configuration
- **Performance Tuning**: Adaptive settings for different devices

## 🛠 Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **AI/ML**: TensorFlow.js with COCO-SSD model
- **Camera**: WebRTC Media APIs with canvas overlay system
- **Styling**: Tailwind CSS + Framer Motion
- **Storage**: IndexedDB with proper async initialization
- **Cloud**: Azure Blob Storage with SAS token authentication
- **PWA**: Workbox + Service Workers for offline functionality
- **Build**: Vite with TypeScript compilation
- **Deployment**: Vercel/Netlify ready, mobile PWA support

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Create desktop app (Electron)
npm run electron

# Create mobile app (Capacitor)
npm run mobile:build
```

## 🛠 Tech Stack

- **Frontend**: React + TypeScript + Vite
- **ML**: TensorFlow.js + YOLO models
- **Camera**: WebRTC Media APIs
- **Styling**: Tailwind CSS + Framer Motion
- **Storage**: IndexedDB + Azure Blob Storage
- **Authentication**: NextAuth.js + OAuth providers
- **Database**: Prisma + SQLite/PostgreSQL
- **PWA**: Workbox + Service Workers
- **Desktop**: Electron (optional)
- **Mobile**: Capacitor (optional)

## 🔐 Authentication Setup

This app includes OAuth authentication with Google and GitHub providers. To set up authentication for development:

### 1. Copy Environment Variables
```bash
cp .env.example .env.local
```

### 2. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client IDs**
5. Set the authorized redirect URI to: `http://localhost:3001/api/auth/callback/google`
6. Copy the Client ID and Client Secret to your `.env.local` file

### 3. GitHub OAuth Setup
1. Go to **GitHub Settings** > **Developer settings** > **OAuth Apps**
2. Click **New OAuth App**
3. Set Homepage URL to: `http://localhost:3001`
4. Set Authorization callback URL to: `http://localhost:3001/api/auth/callback/github`
5. Copy the Client ID and Client Secret to your `.env.local` file

### 4. Generate NextAuth Secret
```bash
openssl rand -base64 32
```
Add this to your `.env.local` file as `NEXTAUTH_SECRET`

### 5. Initialize Database
```bash
npx prisma generate
npx prisma db push
```

## 📱 Deployment Options

1. **Web App**: Deploy to Vercel/Netlify
2. **Desktop App**: Package with Electron
3. **Mobile App**: Build with Capacitor
4. **Edge Deployment**: Use Edge Workers

This approach lets you:
- ✅ Develop everything in VS Code
- ✅ Use TensorFlow.js for ML
- ✅ Access device cameras
- ✅ Deploy to web, desktop, and mobile
- ✅ Integrate with Azure cloud services
- ✅ Learn modern web ML development