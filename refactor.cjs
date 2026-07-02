const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const compDir = path.join(srcDir, 'components');

const fileMapping = {
  // pages
  'HomePage.tsx': 'pages/HomePage.tsx',
  'LoginPage.tsx': 'pages/LoginPage.tsx',
  'SettingsPage.tsx': 'pages/SettingsPage.tsx',
  'MeetingRoom.tsx': 'pages/MeetingRoom.tsx',
  
  // features/dashboard
  'AdminDashboard.tsx': 'features/dashboard/AdminDashboard.tsx',
  'UserDashboard.tsx': 'features/dashboard/UserDashboard.tsx',
  'FacultyStudentDashboard.tsx': 'features/dashboard/FacultyStudentDashboard.tsx',
  'AnalyticsDashboard.tsx': 'features/dashboard/AnalyticsDashboard.tsx',
  
  // features/meeting
  'VideoContainer.tsx': 'features/meeting/VideoContainer.tsx',
  'ControlBar.tsx': 'features/meeting/ControlBar.tsx',
  'ParticipantsPanel.tsx': 'features/meeting/ParticipantsPanel.tsx',
  'ChatSidebar.tsx': 'features/meeting/ChatSidebar.tsx',
  'Header.tsx': 'features/meeting/Header.tsx',
  'VolumeSlider.tsx': 'features/meeting/VolumeSlider.tsx',
  'BreakoutRooms.tsx': 'features/meeting/BreakoutRooms.tsx',
  'ScreenRecording.tsx': 'features/meeting/ScreenRecording.tsx',
  'VirtualBackgrounds.tsx': 'features/meeting/VirtualBackgrounds.tsx',
  'Whiteboard.tsx': 'features/meeting/Whiteboard.tsx',
  'FileSharing.tsx': 'features/meeting/FileSharing.tsx',
  'WaitingRoom.tsx': 'features/meeting/WaitingRoom.tsx',
  'Reactions.tsx': 'features/meeting/Reactions.tsx',
  'FloatingReactions.tsx': 'features/meeting/FloatingReactions.tsx',
  'MeetingHistory.tsx': 'features/meeting/MeetingHistory.tsx',
  'MeetingInvite.tsx': 'features/meeting/MeetingInvite.tsx',
  
  // features/teams
  'AcademicSidebar.tsx': 'features/teams/AcademicSidebar.tsx',
  'AcademicStructure.tsx': 'features/teams/AcademicStructure.tsx',
  'TeamContacts.tsx': 'features/teams/TeamContacts.tsx',
  'TeamSwitcher.tsx': 'features/teams/TeamSwitcher.tsx',
  'CreateTeamModal.tsx': 'features/teams/CreateTeamModal.tsx',
  'AddMemberModal.tsx': 'features/teams/AddMemberModal.tsx',
  'StudentSelectionModal.tsx': 'features/teams/StudentSelectionModal.tsx',
  'SelectMembers.tsx': 'features/teams/SelectMembers.tsx',
  'academic-selector': 'features/teams/academic-selector', // This is a directory
  
  // features/calendar
  'CalendarIntegration.tsx': 'features/calendar/CalendarIntegration.tsx',
  
  // components/ui
  'Toast.tsx': 'components/ui/Toast.tsx',
  'IconButton.tsx': 'components/ui/IconButton.tsx',
  'AccessibleModal.tsx': 'components/ui/AccessibleModal.tsx',
  'ProfileDropdown.tsx': 'components/ui/ProfileDropdown.tsx',
  'NotificationsSystem.tsx': 'components/ui/NotificationsSystem.tsx',
  
  // components/feedback
  'LoadingSkeletons.tsx': 'components/feedback/LoadingSkeletons.tsx',
  'EmptyStates.tsx': 'components/feedback/EmptyStates.tsx',
  'ErrorHandling.tsx': 'components/feedback/ErrorHandling.tsx',
  
  // components/layout
  'HierarchicalSidebar.tsx': 'components/layout/HierarchicalSidebar.tsx',
  
  // components/accessibility
  'AccessibilityComponents.tsx': 'components/accessibility/AccessibilityComponents.tsx',
  'AnimationEffects.tsx': 'components/accessibility/AnimationEffects.tsx',
  'UIEnhancements.tsx': 'components/accessibility/UIEnhancements.tsx',
};

// 1. Create directories
const directoriesToCreate = [
  'pages',
  'features/dashboard',
  'features/meeting',
  'features/teams',
  'features/calendar',
  'components/ui',
  'components/feedback',
  'components/layout',
  'components/accessibility'
];

directoriesToCreate.forEach(dir => {
  const fullPath = path.join(srcDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Helper to get all files in a directory recursively
function getAllFiles(dirPath, arrayOfFiles) {
  files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });
  return arrayOfFiles;
}

// Map component name (without extension) to its new relative path from src
const componentPathMap = {};
for (const [oldName, newRelPath] of Object.entries(fileMapping)) {
  const compName = oldName.replace('.tsx', '');
  componentPathMap[compName] = newRelPath.replace('.tsx', '');
}

// Function to update imports in a file
function updateImports(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Which folder is this file in, relative to src?
  const relFileDir = path.dirname(path.relative(srcDir, filePath));
  
  // Replace imports like: from './components/X' or from './X' or from '../components/X'
  // We'll use a regex that looks for import statements
  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  const lazyImportRegex = /import\(['"]([^'"]+)['"]\)/g;
  
  function replacer(match, p1) {
    // If it's not a relative import, skip
    if (!p1.startsWith('.')) return match;
    
    // Get the base name of the imported component
    const importedName = path.basename(p1);
    
    if (componentPathMap[importedName]) {
      // It's one of our moved components!
      const newTargetPath = path.join(srcDir, componentPathMap[importedName]);
      const currentFileDir = path.dirname(filePath);
      
      let relativeToNewPath = path.relative(currentFileDir, newTargetPath);
      if (!relativeToNewPath.startsWith('.')) {
        relativeToNewPath = './' + relativeToNewPath;
      }
      
      // Clean up Windows backslashes if any
      relativeToNewPath = relativeToNewPath.replace(/\\/g, '/');
      
      changed = true;
      return match.replace(p1, relativeToNewPath);
    }
    
    return match;
  }
  
  content = content.replace(importRegex, replacer);
  content = content.replace(lazyImportRegex, replacer);
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

// 2. Move files
for (const [oldName, newRelPath] of Object.entries(fileMapping)) {
  const oldPath = path.join(compDir, oldName);
  const newPath = path.join(srcDir, newRelPath);
  
  if (fs.existsSync(oldPath)) {
    // For directories (academic-selector), fs.renameSync works
    fs.renameSync(oldPath, newPath);
  }
}

// 3. Update imports in all files in src
const allSrcFiles = getAllFiles(srcDir);
allSrcFiles.forEach(updateImports);

console.log("Restructuring and import updates complete.");
