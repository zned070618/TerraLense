import {
  assistantSession,
  askAssistant,
  clearAssistant,
} from "./assistantClient.js";
import { renderSafeMarkdown } from "./safeMarkdown.js";
import { icon, toast } from "./ui.js";

const $ = (selector) => document.querySelector(selector);
function node(tag, className, text) {
  const item = document.createElement(tag);
  item.className = className;
  if (text !== undefined) item.textContent = text;
  return item;
}
export function createAssistantChat() {
  let context = null,
    stale = false,
    busy = false,
    configured = false,
    version = 0;
  const conversations = new Map();
  const messages = () => conversations.get(context?.datasetId) || [];
  function availability() {
    const ready = Boolean(context?.datasetId) && !stale && configured;
    $("#aiQuestion").disabled = !ready || busy;
    $("#aiSend").disabled = !ready || busy;
    $("#clearChat").disabled = busy || !context?.datasetId;
    $("#askChartAi").disabled = !ready || busy;
    $("#generateAiInsights").disabled = !ready || busy;
    $("#generateAiInsights").hidden = !context?.dataset;
    $("#aiTyping").hidden = !busy;
    $("#aiMessages").setAttribute("aria-busy", String(busy));
    $("#aiContext").textContent = !context?.dataset
      ? "Fetch NASA POWER to attach verified climate data."
      : !context.datasetId
        ? "NASA charts are available. The secure AI backend is offline."
        : stale
          ? "Selection changed. Fetch NASA POWER to update AI context."
          : `Verified point ${context.dataset.latitude.toFixed(4)}, ${context.dataset.longitude.toFixed(4)} | ${context.chart.startYear}-${context.chart.endYear} | ${context.chart.parameter} | ${context.chart.type} / ${context.chart.resolution}`;
  }
  function render() {
    const items = messages();
    $("#aiMessages").replaceChildren();
    if (!items.length) {
      const empty = node("div", "ai-chat-empty");
      const symbol = node("span", "metric-icon");
      symbol.innerHTML = icon("spark");
      empty.append(
        symbol,
        node("h4", "", "Your climate, in conversation."),
        node(
          "p",
          "",
          "Ask about the hottest year, rainfall patterns, or the graph you are viewing. Answers use server-verified NASA data.",
        ),
      );
      $("#aiMessages").append(empty);
    }
    for (const message of items) {
      const article = node("article", `ai-message ${message.role}`),
        header = node("div", "ai-message-header");
      header.append(
        node("strong", "", message.role === "user" ? "You" : "TerraLens AI"),
      );
      if (message.role === "assistant") {
        const copy = node("button", "copy-answer", "Copy");
        copy.type = "button";
        copy.setAttribute("aria-label", "Copy assistant answer");
        copy.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(message.text);
            toast("Answer copied.");
          } catch {
            toast("Clipboard unavailable. Select the answer text to copy it.");
          }
        });
        header.append(copy);
      }
      const body = node("div", "ai-message-body");
      if (message.role === "assistant") renderSafeMarkdown(body, message.text);
      else body.textContent = message.text;
      article.append(header, body);
      if (message.label)
        article.append(node("div", "ai-message-context", message.label));
      $("#aiMessages").append(article);
    }
    $("#aiMessages").scrollTop = $("#aiMessages").scrollHeight;
  }
  function suggestions() {
    const dataset = context?.dataset,
      questions = ["Explain this climate data."];
    if (dataset?.series.T2M.validCount)
      questions.push(
        "Which years were hottest and coolest?",
        "Has temperature increased over this period?",
      );
    if (dataset?.series.PRECTOTCORR.validCount)
      questions.push(
        "Which year was wettest?",
        "Which months are typically rainy?",
      );
    if (dataset?.series.RH2M.validCount)
      questions.push("What is the average humidity?");
    questions.push("What are the limitations of these data?");
    $("#aiSuggestions").replaceChildren(
      ...questions.slice(0, 6).map((question) => {
        const button = node("button", "", question);
        button.type = "button";
        button.disabled = !context?.datasetId || stale || busy || !configured;
        button.addEventListener("click", () => send(question));
        return button;
      }),
    );
  }
  async function send(question, mode = "chat") {
    if (busy || !context?.datasetId || stale || !configured) return;
    question = question.trim();
    if (question.length < 2 || question.length > 2000) {
      showError("Enter a question between 2 and 2000 characters.");
      return;
    }
    const captured = { ...context, chart: { ...context.chart } },
      id = captured.datasetId,
      requestVersion = ++version;
    const items = conversations.get(id) || [];
    items.push({ role: "user", text: question });
    conversations.set(id, items.slice(-30));
    $("#aiQuestion").value = "";
    $("#aiError").hidden = true;
    busy = true;
    render();
    availability();
    suggestions();
    try {
      const response = await askAssistant({
        datasetId: id,
        question,
        chart: captured.chart,
        mode,
      });
      if (requestVersion !== version) return;
      const saved = conversations.get(id) || [];
      saved.push({
        role: "assistant",
        text: response.answer,
        label: `${response.model} | ${captured.dataset.latitude.toFixed(4)}, ${captured.dataset.longitude.toFixed(4)} | ${response.chart.startYear}-${response.chart.endYear} | ${response.chart.parameter} / ${response.chart.type}${response.cached ? " | cached" : ""}`,
      });
      conversations.set(id, saved.slice(-30));
      if (context?.datasetId === id) render();
    } catch (error) {
      if (requestVersion === version) showError(error.message);
    } finally {
      if (requestVersion === version) {
        busy = false;
        availability();
        suggestions();
      }
    }
  }
  function showError(message) {
    $("#aiError").textContent = message;
    $("#aiError").hidden = false;
  }
  function open() {
    $("#aiChatBody").hidden = false;
    $("#toggleAiChat").setAttribute("aria-expanded", "true");
    $("#toggleAiChat").setAttribute("aria-label", "Collapse assistant");
    $("#assistant").scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "center",
    });
  }
  $("#aiForm").addEventListener("submit", (event) => {
    event.preventDefault();
    send($("#aiQuestion").value);
  });
  $("#aiQuestion").addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      send(event.currentTarget.value);
    }
  });
  $("#toggleAiChat").addEventListener("click", () => {
    const collapsed = !$("#aiChatBody").hidden;
    $("#aiChatBody").hidden = collapsed;
    $("#toggleAiChat").setAttribute("aria-expanded", String(!collapsed));
    $("#toggleAiChat").setAttribute(
      "aria-label",
      collapsed ? "Expand assistant" : "Collapse assistant",
    );
  });
  $("#clearChat").addEventListener("click", async () => {
    if (busy || !context?.datasetId) return;
    try {
      await clearAssistant(context.datasetId);
      conversations.set(context.datasetId, []);
      $("#aiError").hidden = true;
      render();
      toast("Conversation cleared.");
    } catch (error) {
      showError(error.message);
    }
  });
  $("#askChartAi").addEventListener("click", () => {
    open();
    send(
      "Explain the selected graph, its strongest supported patterns, and its limitations.",
    );
  });
  $("#generateAiInsights").addEventListener("click", () => {
    open();
    send("Generate AI climate insights for this verified dataset.", "summary");
  });
  availability();
  render();
  suggestions();
  async function connect(attempt = 0) {
    try {
      const session = await assistantSession();
      configured = session.configured;
      $("#aiProvider").textContent = session.configured
        ? `Gemini / ${session.model}`
        : "Gemini not configured";
      $("#aiProvider").removeAttribute("title");
      availability();
      suggestions();
    } catch (error) {
      configured = false;
      $("#aiProvider").textContent =
        attempt < 4 ? "AI server unavailable — retrying" : "AI backend offline";
      $("#aiProvider").title = error.message;
      availability();
      suggestions();
      // Recover automatically if the local Node service starts after the page.
      const delay = attempt < 4 ? [1000, 2000, 4000, 8000][attempt] : 30000;
      setTimeout(() => connect(Math.min(attempt + 1, 4)), delay);
    }
  }
  connect();
  return {
    setContext(next) {
      const changed = context?.datasetId !== next.datasetId;
      if (changed) {
        version++;
        busy = false;
        $("#aiError").hidden = true;
        if (next.datasetId && !conversations.has(next.datasetId)) {
          if (conversations.size >= 3)
            conversations.delete(conversations.keys().next().value);
          conversations.set(next.datasetId, []);
        }
      }
      context = next;
      availability();
      suggestions();
      if (changed) render();
    },
    setStale(value) {
      stale = value;
      availability();
      suggestions();
    },
  };
}
