import React, { useState } from "react";
import axios from "axios";
import MindMap from "./MindMap";

function App() {
  const [text, setText] = useState("");
  const [mindmap, setMindmap] = useState(null);
  const [mindmapUrl, setMindmapUrl] = useState(""); // ✅ NEW
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [previewPages, setPreviewPages] = useState([]);
  const [status, setStatus] = useState("idle"); // idle, success, need_input

  const handleGenerate = async (selectedPage = null) => {
    console.log("🚀 handleGenerate CALLED", selectedPage ? `with page: ${selectedPage}` : "");

    if (!text.trim() && !selectedPage) {
      alert("Please enter some text");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      if (!selectedPage) {
        setMindmap(null);
        setMindmapUrl(""); // ✅ reset URL
      }

      console.log("📡 Sending request to backend...");

      const payload = selectedPage
        ? { input_type: "text", content: text, mode: "balanced", select_page: selectedPage }
        : { input_type: "text", content: text, mode: "balanced" };

      const res = await axios.post(
        "http://127.0.0.1:8000/generate-mindmap",
        payload,
        { timeout: 50000 }
      );

      console.log("✅ FULL API RESPONSE:", res.data);

      if (res.data.status === "success" && res.data.mindmap) {
        setMindmap(res.data.mindmap);

        // ✅ NEW: store URL
        if (res.data.url) {
          setMindmapUrl(res.data.url);
        }

        setPreviewPages([]);
        setStatus("success");

      } else if (res.data.status === "need_user_input") {
        setPreviewPages(res.data.pages_preview || []);
        setStatus("need_input");
        setErrorMsg("");
      } else {
        const msg = res.data.message || "Unknown backend error";
        setErrorMsg(msg);
        console.error("⚠️ Backend Error:", res.data);
      }

    } catch (err) {
      console.error("❌ REQUEST ERROR:", err);
      setErrorMsg("Request failed. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#0d1117",
        color: "white"
      }}
    >
      {/* 🔝 TOP INPUT SECTION */}
      <div
        style={{
          padding: "15px",
          borderBottom: "1px solid #30363d",
          background: "#161b22"
        }}
      >
        <h2 style={{ margin: 0 }}>🧠 Mind Map Generator</h2>

        <div style={{ marginTop: 10 }}>
          <textarea
            rows={3}
            style={{
              width: "100%",
              background: "#0d1117",
              color: "white",
              border: "1px solid #30363d",
              borderRadius: 8,
              padding: 10,
              resize: "none"
            }}
            value={text}
            placeholder="Enter text..."
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
          <button
            onClick={() => handleGenerate()}
            disabled={loading}
            style={{
              padding: "8px 16px",
              background: "#238636",
              border: "none",
              borderRadius: 6,
              color: "white",
              cursor: "pointer"
            }}
          >
            {loading ? "Generating..." : "Generate"}
          </button>

          {/* ✅ NEW: OPEN URL BUTTON */}
          {mindmapUrl && (
            <button
              onClick={() => window.open(mindmapUrl)}
              style={{
                padding: "8px 16px",
                background: "#2f81f7",
                border: "none",
                borderRadius: 6,
                color: "white",
                cursor: "pointer"
              }}
            >
              Open JSON
            </button>
          )}
        </div>

        {/* 📑 PREVIEW SELECTION */}
        {status === "need_input" && previewPages.length > 0 && (
          <div style={{
            marginTop: 15,
            padding: 15,
            background: "#21262d",
            borderRadius: 8,
            border: "1px solid #f85149"
          }}>
            <p style={{ margin: "0 0 10px 0", color: "#58a6ff" }}>
              💡 Multiple topics found. Please select one:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {previewPages.map((page, index) => (
                <button
                  key={index}
                  onClick={() => handleGenerate(page)}
                  style={{
                    padding: "6px 12px",
                    background: "#30363d",
                    color: "#c9d1d9",
                    border: "1px solid #484f58",
                    borderRadius: 20,
                    cursor: "pointer",
                    fontSize: "13px"
                  }}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && <p style={{ marginTop: 10 }}>⏳ Generating mind map...</p>}

        {errorMsg && (
          <p style={{ color: "#f85149", marginTop: 10 }}>
            ⚠️ {errorMsg}
          </p>
        )}
      </div>

      {/* 🔥 VISUALIZATION */}
      <div style={{ flex: 1, position: "relative" }}>
        {mindmap ? (
          <MindMap data={mindmap} />
        ) : (
          !loading && status !== "need_input" && (
            <div style={{
              display: "flex",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
              color: "#8b949e"
            }}>
              No mind map yet
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default App;