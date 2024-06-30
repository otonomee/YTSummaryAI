function fetchAndCleanTranscript() {
    function extractTranscript() {
        const currentUrl = location.href;

        // Send message with the current URL
        chrome.runtime.sendMessage({action: "extractTranscript", url: currentUrl}, function(response) {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
            return;
        }
        
        console.log("Received response:", response);
        
        if (response.status === "Success") {
            console.log("Transcript extracted successfully");
            console.log(response.data);
            generatePrompt(response.data)

        } else if (response.status === "Not a YouTube video page") {
            console.log("This is not a YouTube video page");
            reject(new Error("Not a YouTube video page"));
        } else {
            console.log("Unexpected response:", response.status);
            reject(new Error("Unexpected response: " + response.status));
        }
        });
    }
    
    extractTranscript()
}
  
function generatePrompt(transcript) {
    getGPTResponse(`From the provided raw video transcript, distill the core messages and create a succinct list of actionable instructions. Focus on capturing the essence of the key takeaways in a brief format. Each instruction should be clear, concise, and directly derived from the main points of the video. Aim for minimal word count while ensuring each instruction delivers substantial value and clear guidance based on the video's content.(The transcript will be in XML form, please filter it out to be just the transcript only) 

    Transcript:\n\n${transcript}`);
}

function getGPTResponse(transcript) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['openai_api_key'], (result) => {
      const openai_api_key = result.openai_api_key;

      if (!openai_api_key) {
        reject(new Error('OpenAI API key not found'));
        return;
      }

      fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openai_api_key}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are ChatGPT, a large language model 
trained by OpenAI." },
            {
              role: "user",
              content: transcript,
            },
          ],
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data.choices[0].message.content);
          const resp = data.choices[0].message.content;
          chrome.runtime.sendMessage({ action: "GPTResponse", data: resp }, () => {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError);
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        })
        .catch((error) => {
          console.error('Error:', error);
          reject(error);
        });
    });
  });
}
  
  new MutationObserver(() => {
    let target = document.querySelector('#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls')
    if(target && !target.innerHTML.includes('id="generateSum"') && location.href.includes('https://www.youtube.com/watch')) {
        target.querySelector('.ytp-left-controls').insertAdjacentHTML('afterend',`<div class="ytp-button" style="position:relative; display:flex;justify-content:center; align-items:center;"><img src='${chrome.runtime.getURL('/img/openai_logo.png')}' id="generateSum" style="position: relative;padding: 4px; height: 50%; filter: invert(1);"></div>`) ;
        startlistening()
    }
  }).observe(document, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true
  })
  
  function startlistening() {
    document.getElementById('generateSum').addEventListener("click", async () => {
        chrome.runtime.sendMessage({action: "openSidePanel"});
        console.log('clicked')
        fetchAndCleanTranscript()
    })
  }
  
