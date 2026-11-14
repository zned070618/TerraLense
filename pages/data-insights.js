export function renderDataInsights() {
  const mountPoint = document.querySelector("#dataInsightsMount");
  if (!mountPoint) {
    throw new Error("insights mount point not found");
  }

  mountPoint.outerHTML = `
    <section class="section" id="insights" data-nav="Data Insights">
      <div class="section-heading">
        <div>
          <p class="eyebrow">04 / DATA INSIGHTS</p>
          <h2>From observations to understanding.</h2>
          <p>Transparent summaries calculated from your retrieved dataset.</p>
        </div>
        <button
          class="btn secondary"
          id="generateAiInsights"
          type="button"
          hidden
          disabled
        >
          <i data-icon="spark"></i>Generate AI Insights
        </button>
      </div>
      <div class="insight-grid" id="insightGrid">
        <div class="glass insight-empty">
          <i data-icon="spark"></i>
          <p>
            Load a climate dataset to discover its warmest years, rainfall
            patterns, and statistical trends.
          </p>
        </div>
      </div>
      <div class="ai-chat-panel glass" id="assistant">
        <div class="ai-chat-header">
          <div class="ai-identity">
            <span class="metric-icon"><i data-icon="spark"></i></span>
            <div>
              <p class="eyebrow">YOUR CLIMATE RESEARCH COMPANION</p>
              <h3>
                TerraLens AI
                <span id="aiProvider">Connecting to Gemini...</span>
              </h3>
            </div>
          </div>
          <div class="panel-actions">
            <button
              class="btn quiet small"
              id="clearChat"
              type="button"
              disabled
            >
              <i data-icon="reset"></i>Clear chat</button
            ><button
              class="icon-button"
              id="toggleAiChat"
              aria-expanded="true"
              aria-controls="aiChatBody"
              aria-label="Collapse assistant"
              type="button"
            >
              <i data-icon="collapse"></i>
            </button>
          </div>
        </div>
        <p id="aiContext" class="ai-context" role="status">
          Fetch NASA POWER to attach verified climate data.
        </p>
        <div id="aiChatBody">
          <div
            id="aiMessages"
            class="ai-messages"
            role="log"
            aria-label="Climate assistant conversation"
            aria-live="polite"
            aria-relevant="additions"
            aria-busy="false"
          ></div>
          <div id="aiTyping" class="ai-typing" role="status" hidden>
            <span></span><span></span><span></span>TerraLens AI is examining
            the verified evidence...
          </div>
          <div id="aiError" class="notice error" role="alert" hidden></div>
          <div
            id="aiSuggestions"
            class="ai-suggestions"
            aria-label="Suggested climate questions"
          ></div>
          <form id="aiForm" class="ai-composer">
            <label class="sr-only" for="aiQuestion"
              >Ask a question about the loaded climate dataset</label
            ><textarea
              id="aiQuestion"
              rows="2"
              maxlength="2000"
              placeholder="Ask about temperature, rainfall, trends, or this graph..."
              disabled
            ></textarea
            ><button id="aiSend" class="btn primary" type="submit" disabled>
              <i data-icon="arrow-up-right"></i><span>Send</span>
            </button>
          </form>
          <p class="ai-disclosure">
            Gemini explains; TerraLens calculates the numerical evidence.
            Questions and verified statistics are sent to Google only when you
            ask. Historical findings are not forecasts.
          </p>
        </div>
      </div>
    </section>
  `;
}
