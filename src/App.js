import React, { useState } from "react";
import axios from "axios";
import MindMap from "./MindMap";

function App() {
  const [text, setText] = useState("");
  const [mindmap, setMindmap] = useState(null);
  const [mindmapUrl, setMindmapUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [previewPages, setPreviewPages] = useState([]);
  const [status, setStatus] = useState("idle");

  const BACKEND_URL =
    "https://mindmap-backend-production-11a6.up.railway.app/generate-mindmap";

  const BASE_URL =
    "https://mindmap-backend-production-11a6.up.railway.app";

  const handleGenerate = async (selectedPage = null) => {
    console.log("🚀 handleGenerate CALLED");

    if (!text.trim() && !selectedPage) {
      alert("Please enter some text");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      if (!selectedPage) {
        setMindmap(null);
        setMindmapUrl("");
      }

      const payload = selectedPage
        ? {
            input_type: "text",
            content: text,
            mode: "balanced",
            select_page: selectedPage,
          }
        : {
            input_type: "text",
            content: text,
            mode: "balanced",
          };

      const res = await axios.post(BACKEND_URL, payload, {
        timeout: 50000,
      });

      console.log("✅ RESPONSE:", res.data);

      if (res.data.status === "success" && res.data.mindmap) {
        // ✅ FIX 1: SET MINDMAP (THIS WAS YOUR MAIN BUG)
        setMindmap(res.data.mindmap);

        // ✅ FIX 2: FIX URL (REMOVE LOCALHOST)
        if (res.data.url) {
          const fixedUrl = res.data.url.replace(
            "http://localhost:8000",
            BASE_URL
          );
          setMindmapUrl(fixedUrl);
        }

        setPreviewPages([]);
        setStatus("success");
      } else if (res.data.status === "need_user_input") {
        setPreviewPages(res.data.pages_preview || []);
        setStatus("need_input");
      } else {
        setErrorMsg(res.data.message || "Backend error");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Request failed. Backend not reachable.");
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
        color: "white",
      }}
    >
      {/* 🔝 INPUT */}
      <div
        style={{
          padding: "15px",
          borderBottom: "1px solid #30363d",
          background: "#161b22",
        }}
      >
        <h2>🧠 Mind Map Generator</h2>

        <textarea
          rows={3}
          style={{
            width: "100%",
            background: "#0d1117",
            color: "white",
            border: "1px solid #30363d",
            borderRadius: 8,
            padding: 10,
          }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text..."
        />

        <div style={{ marginTop: 10 }}>
          <button onClick={() => handleGenerate()} disabled={loading}>
            {loading ? "Generating..." : "Generate"}
          </button>

          {mindmapUrl && (
            <button onClick={() => window.open(mindmapUrl)}>
              Open Mindmap URL
            </button>
          )}
        </div>

        {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
      </div>

      {/* 🔥 GRAPH */}
      <div style={{ flex: 1 }}>
        {mindmap ? (
          <MindMap data={mindmap} />
        ) : (
          <p style={{ textAlign: "center" }}>No mind map yet</p>
        )}
      </div>
    </div>
  );
}

export default App;
