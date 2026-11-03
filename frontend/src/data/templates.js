// Starter prompts shown in the template library.
import {
  Layout,
  Shield,
  Wrench,
  Share2,
  Gamepad2,
  Eye,
  Star,
  Bot,
  Globe,
  Clock,
  Palette,
  BookOpen,
  BarChart3,
  Lock,
  Bookmark,
  Bell,
  FileText,
  MousePointer,
  PenTool,
  Layers,
  Workflow,
} from 'lucide-react';

export const CATEGORIES = [
  { id: 'all', label: 'All Templates', icon: Layers },
  { id: 'productivity', label: 'Productivity', icon: Layout },
  { id: 'privacy', label: 'Privacy & Security', icon: Shield },
  { id: 'devtools', label: 'Developer Tools', icon: Wrench },
  { id: 'social', label: 'Social & Media', icon: Share2 },
  { id: 'fun', label: 'Fun & Games', icon: Gamepad2 },
  { id: 'automation', label: 'Automation', icon: Workflow },
];

export const TEMPLATES = [
  {
    category: 'productivity',
    icon: Layout,
    color: 'purple',
    title: 'Tab Manager Pro',
    description: 'Group, search, and manage browser tabs with keyboard shortcuts and a sleek popup UI.',
    complexity: 'Intermediate',
    prompt: `Create a Chrome extension called "Tab Manager Pro" with:
- A popup that lists all open tabs grouped by window
- A search bar to filter tabs by title or URL
- Click a tab to switch to it, with a close button on each tab
- Keyboard shortcut Ctrl+Shift+F to open the popup
- Clean, modern dark UI with icons for each tab (favicon)
- A "Close Duplicates" button that removes duplicate tabs
- Group tabs by domain with collapsible sections`,
  },
  {
    category: 'productivity',
    icon: Eye,
    color: 'blue',
    title: 'Reading Mode',
    description: 'Strip clutter from articles for distraction-free reading with customizable fonts and themes.',
    complexity: 'Beginner',
    prompt: `Create a Chrome extension called "Reading Mode" that:
- Adds a toolbar button to toggle reading mode on any webpage
- When activated, strips ads, sidebars, navigation, and clutter
- Shows only the main article content in a clean centered layout
- Provides font size controls (small, medium, large)
- Has a dark mode / light mode / sepia toggle
- Saves user preferences using chrome.storage
- Has a popup with the controls and a toggle switch`,
  },
  {
    category: 'devtools',
    icon: Wrench,
    color: 'emerald',
    title: 'Screenshot & Annotate',
    description: 'Capture the visible page area and annotate with shapes, arrows, and text overlays.',
    complexity: 'Advanced',
    prompt: `Create a Chrome extension called "Screenshot & Annotate" that:
- Has a popup with a "Capture Page" button
- Captures the visible area of the current tab
- Opens the screenshot in a new tab with an annotation overlay
- The annotation overlay lets users draw rectangles, circles, and arrows
- Users can add text labels anywhere on the screenshot
- Has color picker for annotation tools (red, blue, green, yellow)
- Has undo/redo buttons
- Has a "Download" button that saves the annotated image as PNG
- Clean toolbar UI for the annotation tools`,
  },
  {
    category: 'privacy',
    icon: Shield,
    color: 'rose',
    title: 'Social Media Timer',
    description: 'Set daily time limits on social media sites with notifications and usage stats.',
    complexity: 'Intermediate',
    prompt: `Create a Chrome extension called "Social Media Timer" that:
- Tracks time spent on social media sites (Twitter/X, Instagram, Facebook, Reddit, TikTok, YouTube)
- Has a popup showing today's usage per site with progress bars
- Lets users set daily time limits per site (e.g., 30 min for Twitter)
- Shows a warning overlay when 80% of the limit is reached
- Blocks the site with a custom page when the limit is exceeded
- The block page has a motivational quote and a "5 more minutes" button (usable once per day)
- Stores data using chrome.storage and resets daily
- Has a clean dashboard-style popup UI`,
  },
  {
    category: 'fun',
    icon: Gamepad2,
    color: 'amber',
    title: 'Password Strength Checker',
    description: 'Overlay real-time password strength meters directly on any signup form.',
    complexity: 'Beginner',
    prompt: `Create a Chrome extension called "Password Strength Checker" that:
- Detects password input fields on any webpage
- Overlays a strength meter bar below each password field
- Checks password against: length (8+ chars), uppercase, lowercase, numbers, special characters
- Shows strength as: Weak (red), Fair (orange), Good (yellow), Strong (green)
- Displays tips like "Add a number" or "Add a special character"
- Works as a content script that injects into all pages
- Has a popup that explains how the scoring works
- Does NOT send any password data anywhere (fully local)`,
  },
  {
    category: 'productivity',
    icon: Star,
    color: 'cyan',
    title: 'Custom New Tab',
    description: 'Replace the new tab page with a personal dashboard — clock, bookmarks, and greeting.',
    complexity: 'Intermediate',
    prompt: `Create a Chrome extension called "Custom New Tab" that:
- Overrides the new tab page with a custom dashboard
- Shows a large centered clock (HH:MM format) with the current date
- Has a personalized greeting based on time of day ("Good morning", "Good afternoon", etc.)
- Asks for the user's name on first use and saves it
- Shows a grid of top bookmarks (8 most visited sites) with favicons
- Has a quick search bar that searches Google
- Has a daily focus input ("What is your main focus today?")
- Beautiful gradient background that changes based on time of day
- Clean, minimal, and aesthetic design`,
  },
  {
    category: 'automation',
    icon: Bot,
    color: 'purple',
    title: 'Auto Form Filler',
    description: 'Save and auto-fill common form fields like name, email, address across any website.',
    complexity: 'Intermediate',
    prompt: `Create a Chrome extension called "Auto Form Filler" that:
- Has a popup where users can save multiple profiles (name, email, phone, address, company)
- Detects form fields on any page and shows a floating "Fill" button
- Auto-fills form fields using saved profile data, matching by field name/type
- Supports multiple profiles (personal, work) with a profile selector
- Stores data securely in chrome.storage.local
- Has a clean popup UI with an edit/delete profile option
- Shows a toast notification when form is filled`,
  },
  {
    category: 'devtools',
    icon: Palette,
    color: 'blue',
    title: 'Color Picker & Palette',
    description: 'Pick any color from a webpage and save a reusable palette with HEX, RGB, and HSL values.',
    complexity: 'Intermediate',
    prompt: `Create a Chrome extension called "Color Picker & Palette" that:
- Has an eyedropper tool that lets users pick any color from the current page
- Shows the selected color in HEX, RGB, and HSL formats
- Has a "Copy" button for each format
- Saves picked colors to a palette (stored in chrome.storage)
- The popup shows the saved palette as clickable color swatches
- Users can name each saved color
- Has a delete button for each saved color
- Shows contrast ratio when two colors are selected
- Modern, clean popup UI with color previews`,
  },
  {
    category: 'social',
    icon: BookOpen,
    color: 'emerald',
    title: 'Article Saver / Read Later',
    description: 'Save any article to read later offline with one click. Bookmark manager for articles.',
    complexity: 'Beginner',
    prompt: `Create a Chrome extension called "Read Later" that:
- Adds a "Save for Later" button to the toolbar
- Clicking it saves the current page title, URL, and favicon
- The popup shows a list of saved articles with title and URL
- Each article has an "Open" and "Delete" button
- Has a "Mark as Read" checkbox
- Articles are stored in chrome.storage.local
- Has a search bar to filter saved articles
- Shows article count in the badge on the extension icon
- Clean, minimal card-based UI`,
  },
  {
    category: 'productivity',
    icon: Clock,
    color: 'rose',
    title: 'Pomodoro Focus Timer',
    description: 'Built-in Pomodoro timer with customizable work/break intervals and desktop notifications.',
    complexity: 'Beginner',
    prompt: `Create a Chrome extension called "Pomodoro Focus Timer" that:
- Has a popup with a circular countdown timer
- Default intervals: 25 min work, 5 min short break, 15 min long break
- Let users customize intervals in settings
- Shows "Start", "Pause", "Reset" buttons
- Sends a desktop notification when a timer ends
- Plays a subtle sound when timer finishes
- Tracks completed pomodoros today (counter)
- Updates the badge icon with remaining minutes
- Clean, minimal UI with dark theme`,
  },
  {
    category: 'privacy',
    icon: Lock,
    color: 'purple',
    title: 'Cookie Consent Auto-Blocker',
    description: 'Automatically dismiss annoying cookie consent banners on every website you visit.',
    complexity: 'Advanced',
    prompt: `Create a Chrome extension called "Cookie Consent Blocker" that:
- Automatically detects cookie consent banners on any website
- Uses common CSS selectors to find cookie popups
- Clicks "Reject All" or "Necessary Only" buttons when available
- Falls back to hiding the banner via CSS if no reject button is found
- Has a popup with toggle to enable/disable on specific sites
- Shows count of banners blocked today
- Maintains a whitelist of sites where it's disabled
- Uses a content script that runs on all pages
- Works without breaking the website functionality`,
  },
  {
    category: 'social',
    icon: BarChart3,
    color: 'cyan',
    title: 'YouTube Stats Overlay',
    description: 'Show subscriber counts, view stats, and video analytics overlay on YouTube pages.',
    complexity: 'Intermediate',
    prompt: `Create a Chrome extension called "YouTube Stats Overlay" that:
- Adds a stats panel to YouTube video pages
- Shows estimated earnings range for the video
- Calculates engagement rate (likes / views percentage)
- Shows video age (uploaded X days/months ago)
- Displays like-to-dislike ratio as a visual bar
- Has a popup dashboard showing your recently viewed stats
- Injects cleanly into YouTube's UI using content scripts
- Works on both youtube.com and m.youtube.com
- Modern dark UI that matches YouTube's design`,
  },
  {
    category: 'devtools',
    icon: FileText,
    color: 'amber',
    title: 'JSON Viewer & Formatter',
    description: 'Auto-format raw JSON responses in the browser with syntax highlighting and tree view.',
    complexity: 'Beginner',
    prompt: `Create a Chrome extension called "JSON Viewer" that:
- Detects when a browser tab displays raw JSON data
- Auto-formats and syntax-highlights the JSON
- Shows a collapsible tree view of the JSON structure
- Has a search/filter bar to find keys or values
- Copy button to copy formatted or minified JSON
- Toggle between formatted and raw view
- Shows data types with color coding (strings=green, numbers=blue, booleans=purple, null=gray)
- Has line numbers
- Works on any URL that returns JSON content`,
  },
  {
    category: 'fun',
    icon: MousePointer,
    color: 'rose',
    title: 'Custom Cursor',
    description: 'Replace the boring default cursor with fun animated cursors on any website.',
    complexity: 'Beginner',
    prompt: `Create a Chrome extension called "Custom Cursor" that:
- Has a popup with a grid of cursor styles (crosshair, pointer hand, rainbow trail, neon glow, pixel art)
- Clicking a cursor style applies it to all websites
- Uses CSS cursor property and custom SVG/canvas cursors
- Has an "Add trail effect" toggle that adds a particle trail behind the cursor
- Saves selected cursor to chrome.storage
- Has a "Reset to default" button
- Works on all websites via content script
- Has a colorful, playful popup UI`,
  },
  {
    category: 'automation',
    icon: Bell,
    color: 'blue',
    title: 'Price Drop Alert',
    description: 'Track product prices on Amazon/eBay and get notified when the price drops.',
    complexity: 'Advanced',
    prompt: `Create a Chrome extension called "Price Drop Alert" that:
- Detects product pages on Amazon and popular e-commerce sites
- Shows a "Track Price" button on the popup
- Extracts the current price from the page
- Stores tracked products with their prices in chrome.storage
- Checks prices periodically using alarms API
- Sends a notification when a price drops below the tracked price
- Has a popup dashboard showing all tracked products with current vs original price
- Shows price change percentage (green for drop, red for increase)
- Has "Stop Tracking" and "Clear All" buttons
- Clean dashboard UI with product images`,
  },
  {
    category: 'productivity',
    icon: Bookmark,
    color: 'emerald',
    title: 'Quick Notes',
    description: 'Take quick notes in a popup with markdown support, pinning, and color tags.',
    complexity: 'Beginner',
    prompt: `Create a Chrome extension called "Quick Notes" that:
- Has a popup with a note editor and note list
- Users can create, edit, and delete notes
- Each note has a title, content, and color tag (yellow, green, blue, pink)
- Notes can be pinned to the top
- Supports basic markdown (bold, italic, lists)
- Has a search bar to find notes
- Stores notes in chrome.storage.local
- Shows total note count on the extension badge
- Clean, card-based UI with soft colors
- Sort by date created or last modified`,
  },
  {
    category: 'devtools',
    icon: Globe,
    color: 'purple',
    title: 'HTTP Header Inspector',
    description: 'View and modify HTTP request/response headers for the current page.',
    complexity: 'Advanced',
    prompt: `Create a Chrome extension called "Header Inspector" that:
- Shows all HTTP request and response headers for the current page
- Displays headers in a clean table format (name, value)
- Color-codes important headers (Content-Type, Authorization, Cache-Control)
- Has a search/filter bar for headers
- Shows response status code with color (green=2xx, yellow=3xx, red=4xx/5xx)
- Copy individual headers or all headers as JSON
- Has tabs for Request Headers and Response Headers
- Uses chrome.webRequest API
- Dark, developer-friendly UI with monospace fonts`,
  },
  {
    category: 'automation',
    icon: PenTool,
    color: 'cyan',
    title: 'Text Highlighter & Saver',
    description: 'Highlight text on any webpage and save highlights with notes for later reference.',
    complexity: 'Intermediate',
    prompt: `Create a Chrome extension called "Text Highlighter" that:
- Lets users select text on any webpage and right-click to highlight it
- Offers 4 highlight colors (yellow, green, blue, pink)
- Saves highlights with the page URL and title
- Re-applies highlights when revisiting the same page
- Has a popup showing all highlighted pages
- Clicking a saved page opens it and scrolls to the highlight
- Users can add a note to each highlight
- Has a "Delete highlight" option
- Export all highlights as a text file
- Uses chrome.storage for persistence`,
  },
  {
    category: 'privacy',
    icon: Eye,
    color: 'amber',
    title: 'Incognito Tab Opener',
    description: 'One-click button to open any link or current page in an incognito window.',
    complexity: 'Beginner',
    prompt: `Create a Chrome extension called "Incognito Opener" that:
- Adds a popup with an "Open Current Tab in Incognito" button
- Adds a right-click context menu option "Open Link in Incognito"
- Shows the number of incognito windows currently open
- Has a "Quick Open" input field where users can paste a URL to open in incognito
- Has a toggle for "Always open selected domains in incognito" with a domain list
- Stores domain preferences in chrome.storage
- Clean, minimal dark UI
- Works with keyboard shortcut Ctrl+Shift+I`,
  },
  {
    category: 'social',
    icon: Share2,
    color: 'rose',
    title: 'Social Share Buttons',
    description: 'Add floating share buttons to any page for Twitter, LinkedIn, WhatsApp, and more.',
    complexity: 'Beginner',
    prompt: `Create a Chrome extension called "Quick Share" that:
- Injects floating share buttons on every webpage (right side)
- Buttons for: Twitter/X, LinkedIn, WhatsApp, Telegram, Email, Copy Link
- Clicking a button opens the share dialog with the current page title and URL pre-filled
- Has a popup to toggle which platforms to show
- Users can choose button position (left or right side)
- Buttons animate in with a slide effect
- Has a compact mode (icons only) and expanded mode (icons + labels)
- Saves preferences in chrome.storage
- Buttons don't interfere with page content`,
  },
];
