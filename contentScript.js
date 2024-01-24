function fetchAndCleanTranscript() {
  const fillerWords = new Set(["uh", "um", "ah", "like", "so", "you know", "actually", "basically", "seriously", "literally"]);
  const clickEvent = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
  });

  function cleanText(text) {
    return text
      .split(" ")
      .filter((word) => !fillerWords.has(word.toLowerCase()))
      .join(" ");
  }

  function shortenSentences(text) {
    // Placeholder for sentence shortening logic
    return text
      .split(". ")
      .map((sentence) => {
        if (sentence.split(" ").length > 15) {
          // Example threshold for sentence length
          // Logic to shorten the sentence
          return sentence.split(" ").slice(0, 15).join(" ") + "...";
        }
        return sentence;
      })
      .join(". ");
  }

  function removeRepetitions(text) {
    const sentences = new Set();
    return text
      .split(". ")
      .filter((sentence) => {
        const trimmed = sentence.trim();
        if (!sentences.has(trimmed)) {
          sentences.add(trimmed);
          return true;
        }
        return false;
      })
      .join(". ");
  }

  function extractTranscript() {
    return new Promise((resolve, reject) => {
      let observer = new MutationObserver((mutations, observer) => {
        let elsTranscriptChunks = document.querySelectorAll(".segment-text.style-scope.ytd-transcript-segment-renderer");
        if (elsTranscriptChunks.length > 0) {
          let transcript = "";
          Array.prototype.slice.call(elsTranscriptChunks).forEach(function (chunk) {
            transcript += chunk.innerText + " ";
          });
          transcript = transcript.trim();
          transcript = cleanText(transcript);
          transcript = removeRepetitions(transcript);

          // Remove duplicate words
          let words = transcript.split(" ");
          let uniqueWords = [...new Set(words)];
          transcript = uniqueWords.join(" ");

          // Truncate to 3800 words
          words = transcript.split(" ");
          if (words.length > 3800) {
            transcript = words.slice(0, 3800).join(" ");
          }

          console.log(transcript);
          resolve(transcript);
          observer.disconnect();
        }
      });

      // Start observing
      observer.observe(document, { childList: true, subtree: true });
    });
  }

  return new Promise((resolve, reject) => {
    let observer = new MutationObserver((mutations, observer) => {
      // Check if the required element is available
      let expandButton = document.querySelector("#expand");
      if (expandButton) {
        expandButton.click();
        observer.disconnect(); // Stop observing when the element is found

        let secondObserver = new MutationObserver((mutations, secondObserver) => {
          let transcriptButton = document.querySelector(
            "#primary-button > ytd-button-renderer > yt-button-shape > button > yt-touch-feedback-shape > div > div.yt-spec-touch-feedback-shape__fill"
          );
          if (transcriptButton) {
            transcriptButton.dispatchEvent(clickEvent);
            secondObserver.disconnect();

            // Use the new promise-based extractTranscript function
            extractTranscript()
              .then((transcript) => {
                resolve(transcript);
              })
              .catch((error) => {
                reject(error);
              });
          }
        });

        // Start observing
        secondObserver.observe(document, { childList: true, subtree: true });
      }
    });

    // Start observing
    observer.observe(document, { childList: true, subtree: true });
  });
}

function generatePrompt(transcript) {
  return `From the provided raw video transcript, distill the core messages and create a succinct list of actionable instructions. Focus on capturing the essence of the key takeaways in a brief format. Each instruction should be clear, concise, and directly derived from the main points of the video. Aim for minimal word count while ensuring each instruction delivers substantial value and clear guidance based on the video's content. 

Transcript:\n\n${transcript}`;
}

async function getGPTResponse(transcript) {
  const prompt = generatePrompt(transcript);
  let openai_api_key = "";

  const gptResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${openai_api_key}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are ChatGPT, a large language model trained by OpenAI." },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  const responseData = await gptResponse.json();
  return responseData.choices[0].message.content;
}

// Usage
(async () => {
  try {
    const cleanedTranscript = await fetchAndCleanTranscript();
    const gptResults = await getGPTResponse(cleanedTranscript);
    console.log(gptResults);
  } catch (error) {
    console.error("An error occurred:", error);
  }
})();
// Create a new button element// Create a new button element
var newButton = document.createElement("button");
newButton.innerHTML = "Generate GPT Response";
newButton.style.position = "fixed";
newButton.style.top = "10px";
newButton.style.right = "10px";
newButton.style.zIndex = "9999";
newButton.addEventListener("click", async function () {
  try {
    const cleanedTranscript = await fetchAndCleanTranscript();
    const gptResults = await getGPTResponse(cleanedTranscript);
    console.log(gptResults);
    // Create a new div element
    var newDiv = document.createElement("div");
    newDiv.setAttribute("class", "gpt-results");
    newDiv.innerHTML = gptResults;
    // Wait for the panels div to be available
    await new Promise((resolve, reject) => {
      let observer = new MutationObserver((mutations, observer) => {
        // Check if the panels div is available
        let panelsDiv = document.getElementById("panels");
        if (panelsDiv) {
          // Insert the new div before the panels div
          panelsDiv.parentNode.insertBefore(newDiv, panelsDiv);
          observer.disconnect(); // Stop observing when the div is found
          resolve();
        }
      });
      // Start observing
      observer.observe(document, { childList: true, subtree: true });
    });
  } catch (error) {
    console.error("An error occurred:", error);
  }
});

// Wait for the actions div to be available
new Promise((resolve, reject) => {
  let observer = new MutationObserver((mutations, observer) => {
    // Check if the actions div is available
    let actionsDiv = document.getElementById("actions");
    if (actionsDiv) {
      // Add the new button to the actions div
      actionsDiv.appendChild(newButton);
      observer.disconnect(); // Stop observing when the div is found
      resolve();
    }
  });

  // Start observing
  observer.observe(document, { childList: true, subtree: true });
});
