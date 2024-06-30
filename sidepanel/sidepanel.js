chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "GPTResponse") {
        let gptresp = message.data;
        document.getElementById('main').innerHTML = gptresp;
    }
})