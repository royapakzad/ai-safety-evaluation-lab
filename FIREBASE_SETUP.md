# Firebase Setup Guide

Your web app has been successfully configured to use Firebase for authentication and data persistence. Follow these steps to complete the setup:

## 1. Configure Your Firebase Project

You mentioned you already created a Firebase project. Now you need to:

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**
3. **Add a web app**:
   - Click "Add app" and select Web (</>) 
   - Register your app with a nickname
   - Copy the configuration object

## 2. Update Firebase Configuration

Replace the placeholder values in `firebase.config.ts` with your actual Firebase project configuration:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com", 
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-actual-app-id"
};
```

## 3. Enable Authentication

1. In Firebase Console, go to **Authentication** > **Get started**
2. Go to **Sign-in method** tab
3. Enable **Email/Password** authentication
4. Click **Save**

## 4. Set Up Firestore Database

1. In Firebase Console, go to **Firestore Database** > **Create database**
2. Choose **Start in test mode** (you can secure it later)
3. Select a location for your database
4. Click **Done**

## 5. Configure Firestore Security Rules

Go to **Firestore Database** > **Rules** and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Evaluations: users can read/write their own, admins can read all
    match /evaluations/{evalId} {
      allow read, write: if request.auth != null && 
        (resource.data.userEmail == request.auth.token.email || 
         request.auth.token.email == 'rpakzad@taraazresearch.org');
      allow create: if request.auth != null;
    }
  }
}
```

## 6. Test the Setup

1. Run your development server: `npm run dev`
2. Try creating a new account with the sign-up form
3. Log in and create an evaluation
4. Log out and log back in to verify data persistence
5. Check the Firestore Console to see your data

## What Has Been Implemented

✅ **Firebase SDK**: Installed and configured
✅ **Authentication**: Email/password with automatic role assignment
✅ **Database Migration**: Converted from localStorage to Firestore
✅ **Data Persistence**: Evaluations now sync across devices and browsers
✅ **User Management**: Automatic user profile creation
✅ **Security**: Role-based access (admin vs evaluator)

## Key Features

- **Cross-device sync**: Users can access their evaluations from any browser
- **Secure authentication**: Proper email/password authentication
- **Role-based access**: Admin users see all evaluations, evaluators see only their own
- **Real-time data**: Changes are immediately saved to the cloud
- **Offline capability**: Firebase provides automatic offline support

Your app now has a proper backend with persistent storage!