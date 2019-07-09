# How to create Google Chrome Extension on example of Netflix subtitles styler

# Table of Contents

1. [Prelude](#1)
2. [The Manifest](#2)
3. [Extension logic](#3)
4. [Extension UI](#4)
5. [The script](#5)
6. [Time to run](#6)
7. [Conclusions](#7)

<a name="1"></a>

# Prelude

Today we will create Google Chrome extension for manipule Netflix subtitles styles in real time. You find here informations about creating extension from scratch, some practical advices and general view on extension architecture. Or if you are not satisfied about Netflix subtitles available options or just want to quickly create some making life easier extension this article is for you.

Our goals:

- create extension logic
- store settings in browser Local Storage
- autoload and activate extension only on Netflix page
- create popup menu
- create form with subtitles options

Requirements:

- basic knowledge of HTML, CSS and JavaScript

Netflix by its API sends every subtitle sentence separately. It uses CSS styles for styling subtitles. With access to the page DOM we can manipulate those received styles with Chrome extension.

<a name="2"></a>

# The Manifest

Firstly we have to create the manifest file called `manifest.json`. It tells browser about the extension setup such as the UI files, background scripts and the capabilities the extension might use.

Here is complete manifest.

```json
{
  "name": "Netflix subtitles styler",
  "version": "1.0",
  "description": "Netflix subtitles styler",
  "author": "twistezo",
  "permissions": ["tabs", "storage", "declarativeContent", "https://*.netflix.com/"],
  "background": {
    "scripts": ["background.js"],
    "persistent": false
  },
  "page_action": {
    "default_popup": "popup.html",
    "default_icon": "logo.png"
  },
  "manifest_version": 2
}
```

As you see we have a couple of standard information like `name`, `version`, `description`, `homepage_url` and `manifest_version`.

One of the important part of manifest is `permissions` section. It is an array with elements which our extension can have access.

In our case we need to have access to `tabs` for possibility to find active tab, execute scripts and send message between UI and extension. We need `storage` for store extension settings in browser and `declarativeContent` for taking actions depended on the tab content. The last element `https://*.netflix.com/` is for allow extension acces only to `netflix.com` domain.

Chrome extensions have separate logic from UI so we need to have `background.scripts` which tells the extension where it can find its logic. `persistent: false` means that this script will be used only if needed. `page_action` is section with UI part. We have here simple HTML file for popup menu and extension's PNG logo.

<a name="3"></a>

# Extension logic

Firstly we have to setup `runtime.onInstalled` behaviour, remove currently rules if exists (ex. from older version) and declare function to add new rules. We use Local Storage for store settings so we can set default settings after extension installed.

We will be use three subtitles style parameters:

- `vPos` - vertical position from bottom [px]
- `fSize` - font size [px]
- `fColor` - font color [HEX]

Create `background.js`:

```javascript
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ vPos: 300, fSize: 24, fColor: "#FFFFFF" });

  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([
      // array with rules
    ]);
  });
});
```

Our rule goal is to disable extension button on all other domain than `netflix.com`. We create new rule with `PageStateMatcher` condition and declare `ShowPageAction` where new rule will be assigned.

```javascript
{
  conditions: [
    new chrome.declarativeContent.PageStateMatcher({
      pageUrl: { hostSuffix: "netflix.com" }
    })
  ],
  actions: [new chrome.declarativeContent.ShowPageAction()]
}
```

The next step is add `tabs.onUpdated` listener which will execute our script while load or refresh active tab.

```javascript
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.active) {
    chrome.storage.local.get(["vPos", "fSize", "fColor"], data => {
      chrome.tabs.executeScript(
        tabId,
        {
          file: "script.js"
        },
        () => {
          const error = chrome.runtime.lastError;
          if (error) "Error. Tab ID: " + tab.id + ": " + JSON.stringify(error);

          chrome.tabs.sendMessage(tabId, {
            vPos: data.vPos,
            fSize: data.fSize,
            fColor: data.fColor
          });
        }
      );
    });
  }
});
```

Firstly we check that `changeInfo.status` has status `complete`. It means that the website on this tab is loaded. Then we get settings from Local Storage and declare which script should be run on current tab with `tabId`. At the end in callback we send the message with settings from UI to script.

<a name="4"></a>

# Extension UI

To create extension popup menu with form we create three files. `popup.html` and `popup.css` with visual layer and `popup.js` with logic for communicate between menu and isolated `background.js` script.

Our UI goal:

<img src="https://i.imgur.com/kt6CeVw.png">

Here we have simple HTML form with built-in validation - `popup.html`:

```html
<!DOCTYPE html>
<html>
  <head>
    <link href="https://fonts.googleapis.com/css?family=Open+Sans:400,600" rel="stylesheet" />
    <link rel="stylesheet" href="popup.css" />
  </head>
  <body>
    <div class="container logo">
      NETFLIX SUBTITLES STYLER
    </div>
    <form id="popup-form" class="container">
      <div class="input-info">Vertical position from bottom [px]</div>
      <input class="form-control" id="vPos" type="number" value="" min="0" max="5000" />
      <div class="input-info">Font size [px]</div>
      <input id="fSize" type="number" value="" min="0" max="300" />
      <div class="input-info">Font color [HEX]</div>
      <input id="fColor" type="text" value="" pattern="^#[0-9A-F]{6}$" />
      <button id="change" type="submit">Change</button>
    </form>
    <div class="container footer">
      &copy; twistezo, 2019
    </div>
    <script src="popup.js"></script>
  </body>
</html>
```

Styling this popup menu is not the goal of this article so I suggest to visit https://github.com/twistezo/netflix-subtitles-styler and copy whole `popup.css` file to your project.

UI logic - `popup.js`:

```javascript
const form = document.getElementById("popup-form");
const inputElements = ["vPos", "fSize", "fColor"];

chrome.storage.local.get(inputElements, data => {
  inputElements.forEach(el => {
    document.getElementById(el).value = data[el];
  });
});

form.addEventListener("submit", event => {
  event.preventDefault();
  const [vPos, fSize, fColor] = [...inputElements.map(el => event.target[el].value)];

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.storage.local.set({ vPos, fSize, fColor });
    chrome.tabs.executeScript(
      tabs[0].id,
      {
        file: "script.js"
      },
      () => {
        const error = chrome.runtime.lastError;
        if (error) "Error. Tab ID: " + tab.id + ": " + JSON.stringify(error);

        chrome.tabs.sendMessage(tabs[0].id, { vPos, fSize, fColor });
      }
    );
  });
});
```

In above script we load settings from Local Storage and attach them to form inputs. Then we create listener to `submit` event with functions for save settings to Local Storage and send them by message to our script. As you see in every component we use Local Storage. It is caused that Chrome extension don't have its own data space so the simplest solution is to use browser local space like Local Storage. Also we often use `sendMessage` function. It's by extensions architecture - separated logic from UI.

<a name="5"></a>

# The script

Now it is time to create `script.js` with logic for manipulate Netflix subtitles styles.

Firstly for receiving messages with settings from extension we create `onMessage` listener.

```javascript
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  // function for manipulating styles
});
```

Then in the same file we create function for changing proper Netflix styles to our in real time.

```javascript
changeSubtitlesStyle = (vPos, fSize, fColor) => {
  console.log("%cnetflix-subtitles-styler : observer is working... ", "color: red;");

  callback = () => {
    // .player-timedText
    const subtitles = document.querySelector(".player-timedtext");
    if (subtitles) {
      subtitles.style.bottom = vPos + "px";

      // .player-timedtext > .player-timedtext-container [0]
      const firstChildContainer = subtitles.firstChild;
      if (firstChildContainer) {
        // .player-timedtext > .player-timedtext-container [0] > div
        const firstChild = firstChildContainer.firstChild;
        if (firstChild) {
          firstChild.style.backgroundColor = "transparent";
        }

        // .player-timedtext > .player-timedtext-container [1]
        const secondChildContainer = firstChildContainer.nextSibling;
        if (secondChildContainer) {
          for (const span of secondChildContainer.childNodes) {
            // .player-timedtext > .player-timedtext-container [1] > span
            span.style.fontSize = fSize + "px";
            span.style.fontWeight = "normal";
            span.style.color = fColor;
          }
          secondChildContainer.style.left = "0";
          secondChildContainer.style.right = "0";
        }
      }
    }
  };

  const observer = new MutationObserver(callback);
  observer.observe(document.body, {
    subtree: true,
    attributes: false,
    childList: true
  });
};
```

Netflix works that every time when receive whole subtitle sentence it swaps only the subtitles part of the page DOM. So we have to use observer function like `MutationObserver` which will be triggering our `changeSubtitlesStyle` function every time when the page DOM has changed. In `callback` function we see simple manipulate of styles. In commented lines you have infomations about where you can find proper styles.

<a name="6"></a>

# Time to run

I assume that you have not developer account in Chrome Webstore. So to run this extension go to `chrome://extensions/` in your Chrome, click `Load unpacked`, select folder with extension and that's it! Then obviously go to Netflix page for testing it.

<a name="7"></a>

# Conclusions

As you see it is easy to start creating some making life easier extension. The most important part is to understand Google Chrome Extension divided architecture and communication between components. This subtitles styler is only simple demo of what you can do with the Chrome Extension API.

Useful links:

- Repository with this project https://github.com/twistezo/netflix-subtitles-styler
- Official Google guide https://developer.chrome.com/extensions/overview
- Chrome Extension API https://developer.chrome.com/extensions/api_index
