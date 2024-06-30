console.log("background.js is running");

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.storage.local.set({ openai_api_key: "" });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openSidePanel") {
    chrome.windows.create(
      {
        url: "modal.html",
        type: "popup",
        width: 400,
        height: 300,
      },
      (window) => {
        chrome.windows.onRemoved.addListener((windowId) => {
          if (windowId === window.id) {
            sendResponse({ popupClosed: true });
          }
        });
      }
    );
    return true;
  } else if (message.action === "extractTranscript") {
    function getYoutubeVideoId(url) {
      const regex = /[?&]v=([^&#]*)/;
      const match = url.match(regex);
      return match ? match[1] : null;
    }

    let vidId = getYoutubeVideoId(message.url); // Use the URL passed in the message

    fetch(`https://youtubetranscript.com/?server_vid2=${vidId}`, {
      headers: {
        accept: "application/xml, text/xml, */*; q=0.01",
        "accept-language": "en-US,en;q=0.9",
        priority: "u=1, i",
        "sec-ch-ua": `\"Not/A)Brand\";v=\"8\", \"Chromium\";v=\"126\", \"Google 
Chrome\";v=\"126\""`,
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
      },
      referrerPolicy: "strict-origin-when-cross-origin",
      body: null,
      method: "GET",
      mode: "cors",
      credentials: "omit",
    })
      .then((resp) => resp.text())
      .then((resp) => {
        console.log(resp);
        sendResponse({ status: "Success", data: resp });
      })
      .catch((error) => {
        console.error("Error:", error);
        sendResponse({ status: "Error", error: error.message });
      });

    return true; // Keep the message channel open for asynchronous response
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    if (tab.url && tab.url.match(/https:\/\/www\.youtube\.com\/watch\?v=.*/)) {
      chrome.sidePanel
        .setOptions({
          tabId: tabId,
          path: "sidepanel/sidepanel.html",
          enabled: true,
        })
        .then(() => {
          chrome.sidePanel.open({ tabId: tabId });
        });
    } else {
      chrome.sidePanel.setOptions({
        tabId: tabId,
        enabled: false,
      });
    }
  }
});
