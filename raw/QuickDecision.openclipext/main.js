action = async (selection, options) => {
  const text = selection || (openclip.input && openclip.input.text) || "";
  if (!text || text.trim().length === 0) {
    return null;
  }

  const question = (options && options.question) || openclip.option("question") || "Is this content safe and trustworthy?";
  const affirmative = (options && options.affirmativeLabel) || openclip.option("affirmativeLabel") || "Safe";
  const negative = (options && options.negativeLabel) || openclip.option("negativeLabel") || "Suspicious";
  const model = (options && options.model) || openclip.option("model") || "jev-latest";
  const apiKey = (options && options.apiKey) || openclip.option("apiKey") || "";
  const endpoint = (options && options.endpoint) || openclip.option("endpoint") || "https://api.typesafe.ai/v1/systemone";

  const isLocalEndpoint = endpoint.includes("://localhost") || endpoint.includes("://127.0.0.1") || endpoint.includes("://[::1]");

  if (!apiKey && !isLocalEndpoint) {
    openclip.toast("Missing API Key");
    return null;
  }

  try {
    const headers = {
      "Content-Type": "application/json"
    };
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const payload = {
      model: model,
      state: text,
      questions: {
        decision: {
          type: "noul",
          instructions: question
        }
      }
    };

    const res = await openclip.fetch(endpoint, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      openclip.toast(`API Error (${res.status})`);
      return null;
    }

    const data = await res.json();
    let prob = null;

    // 1. Support Jev / TypeSafe AI System-1 schema: answers.decision.noul
    if (data && data.answers && data.answers.decision && typeof data.answers.decision.noul === "number") {
      prob = data.answers.decision.noul;
    } else if (data && typeof data.probability === "number") {
      // 2. Support standard probability response
      prob = data.probability;
    } else if (data && typeof data.decision === "boolean") {
      // 3. Support binary boolean response
      prob = data.decision ? 1.0 : 0.0;
    } else if (data && typeof data.confidence === "number") {
      prob = data.confidence;
    }

    if (prob === null) {
      const directAnswer = (data && (data.answer || data.result)) || null;
      if (directAnswer) {
        const resultText = String(directAnswer);
        openclip.toast(resultText);
        return resultText;
      }
      openclip.toast("No decision returned");
      return null;
    }

    const isAffirmative = prob >= 0.5;
    const confidencePct = Math.round((isAffirmative ? prob : (1 - prob)) * 100);
    const label = isAffirmative ? affirmative : negative;
    const resultText = `${label} (${confidencePct}%)`;

    openclip.toast(resultText);
    return resultText;
  } catch (err) {
    openclip.toast(`Error: ${err.message}`);
    return null;
  }
};
