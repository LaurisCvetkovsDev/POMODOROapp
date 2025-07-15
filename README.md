# 🍅 ultraPOMODORO365p - Ultimate Pomodoro Timer

A beautiful, feature-rich Pomodoro timer application built with React, TypeScript, and Electron. Boost your productivity with this stylish timer that includes user authentication, friend leaderboards, statistics tracking, and a unique compact mode.

![ultraPOMODORO365p](https://img.shields.io/badge/ultraPOMODORO365p-v1.0.0-red?style=for-the-badge&logo=electron)
![Built with React](https://img.shields.io/badge/React-18.x-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)
![Electron](https://img.shields.io/badge/Electron-28.x-green?style=flat-square&logo=electron)

## ✨ Features

### 🎯 **Core Timer Functionality**

- **Customizable work sessions** (default: 25 minutes)
- **Flexible break durations** (default: 5 minutes)
- **Large, easy-to-read display** with phase indicators
- **Smooth animations** and visual feedback
- **Audio notifications** when sessions complete

### 🖥️ **Dual Display Modes**

- **Full Application Mode**: Complete interface with all features
- **Compact Mode**: Minimalist floating timer that stays on top
- **Seamless switching** between modes with synchronized timer state
- **Always-on-top compact window** for distraction-free work

### 👥 **Social Features**

- **User authentication** and personal accounts
- **Friends system** with leaderboards
- **Session tracking** and statistics
- **Daily goals** and progress monitoring
- **Compare productivity** with friends

### 📊 **Analytics & Insights**

- **Detailed statistics** of your productivity
- **Session history** and patterns
- **Goal tracking** and achievements
- **Visual progress indicators**

### 🎨 **Beautiful Design**

- **Glass-morphism UI** with blur effects
- **Animated backgrounds** with space-themed GIFs
- **Responsive design** that adapts to window size
- **Smooth transitions** and hover effects
- **Dark theme** optimized for focus

## 🚀 Quick Start

### **For Users (Download & Install)**

1. **Download the latest release**:

   - Go to the [Releases page](../../releases)
   - Download `Pomodoro App Setup 1.0.0.exe`
   - Run the installer and follow the setup wizard

2. **Alternative - Portable Version**:
   - Download the portable zip from releases
   - Extract and run `Pomodoro App.exe` directly

### **System Requirements**

- **OS**: Windows 10/11 (64-bit)
- **RAM**: 4GB minimum
- **Storage**: 200MB free space
- **Internet**: Required for authentication and social features

## 🎮 How to Use

### **Getting Started**

1. **Launch the app** and create an account or login
2. **Set your preferences** using the settings gear icon
3. **Click play** to start your first Pomodoro session
4. **Work focused** until the timer ends
5. **Take breaks** when prompted

### **Key Controls**

- **▶️ Play/Pause**: Start or pause the current session
- **🔄 Reset**: Reset the current session to full time
- **➖ Minimize**: Switch to compact floating mode
- **⬜ Restore**: Return to full application mode
- **⚙️ Settings**: Customize timer durations and preferences

### **Compact Mode**

- Click the **minimize button** in the main timer
- Timer becomes a **small floating window**
- **Always stays on top** of other applications
- Click **restore button** to return to full mode
- **Timer state synchronized** between modes

### **Social Features**

- **Add friends** using their usernames
- **View leaderboards** in the Friends tab
- **Track your ranking** and compare progress
- **Set daily goals** and monitor achievements

## 🛠️ For Developers

### **Prerequisites**

- Node.js 18+
- npm or yarn
- Git

### **Installation**

```bash
# Clone the repository
git clone <repository-url>
cd pomodoro

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Build Electron app
npm run electron-pack
```

### **Development Scripts**

- `npm run dev` - Start development server
- `npm run build` - Build web version
- `npm run electron` - Run Electron in development
- `npm run electron-pack` - Build Electron installer
- `npm run preview` - Preview production build

### **Tech Stack**

- **Frontend**: React 18, TypeScript, React Router
- **Styling**: CSS3, Bootstrap 5, Glass-morphism effects
- **Desktop**: Electron 28
- **Build**: Vite, electron-builder
- **State Management**: Zustand
- **Authentication**: Custom JWT system

### **Project Structure**

```
pomodoro/
├── src/
│   ├── components/          # React components
│   ├── contexts/           # React contexts
│   ├── services/           # API services
│   ├── assets/             # Images, sounds, fonts
│   └── App.tsx             # Main app component
├── electron/               # Electron main process
├── dist/                   # Built web assets
└── release/                # Built desktop apps
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### **Areas for Contribution**

- 🐛 Bug fixes and improvements
- ✨ New features and enhancements
- 📚 Documentation improvements
- 🎨 UI/UX enhancements
- 🌍 Internationalization
- 🧪 Testing and quality assurance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Pomodoro Technique** by Francesco Cirillo
- **React** and **Electron** communities
- **Space background animations** and visual assets
- All **beta testers** and **contributors**

<img width="1173" height="752" alt="image" src="https://github.com/user-attachments/assets/56c4d320-c8ef-40a0-a96c-fc3970238770" />



