import React, { useEffect } from "react";
import { aiInvoiceModalStyles } from "../assets/dummyStyles";
import GeminiIcon from "./GeminiIcon";
import AnimatedButton from "../assets/GenerateBtn/Gbtn.jsx";

const AiInvoiceModal = ({ open, onClose, onGenerate, initialText = "" }) => {
  const [text, setText] = React.useState(initialText);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  useEffect(() => {
    setText(initialText);
    setLoading(false);
    setError("");
  }, [open, initialText]);

  if (!open) return null;

  async function handleGenerateClick() {
    setError("");
    const raw = (text || "").trim();
    if (!raw) {
      setError("Please enter a prompt");
      return;
    }

    try {
      setLoading(true);
      const maybePromise = onGenerate(raw);
      if (maybePromise && typeof maybePromise.then === "function") {
        await maybePromise;
      }
    } catch (error) {
      console.log("onGenerate error", error);
      setError(
        error.message || "An error occurred while generating the invoice.",
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className={aiInvoiceModalStyles.overlay} onClick={onClose}>
      <div className={aiInvoiceModalStyles.backdrop} />
      <div
        className={aiInvoiceModalStyles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className={aiInvoiceModalStyles.title}>
              <GeminiIcon className="w-6 h-6 group-hover:scale-110 transition-transform flex-none" />
              Create Invoice with AI
            </h3>

            <p className={aiInvoiceModalStyles.description}>
              Paste a description of the services or products you provided,
              and let AI generate a professional invoice for you.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-all duration-200 text-xl font-semibold leading-none"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="mt-4">
          <label className={aiInvoiceModalStyles.label}>
            Paste invoice text
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={aiInvoiceModalStyles.textarea}
            placeholder="E.g., 'Web design services for Acme Corp, including homepage, about us, and contact page. Total cost: $1500.'"
            rows={8}
          ></textarea>
        </div>

        {error && (
          <div className={aiInvoiceModalStyles.error} role="alert">
            {String(error)
              .split("\n")
              .map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            {(/quota|exhausted|resource_exhausted/i.test(String(error)) && (
              <div style={{ marginTop: 8, fontSize: 13, color: "#374151" }}>
                Tip: AI is temporarily unavailable (quota). Try again in a few
                minutes, or create the invoice manually.
              </div>
            )) ||
              null}
          </div>
        )}

        <div className={aiInvoiceModalStyles.actions}>
          <AnimatedButton onClick={handleGenerateClick} isLoading={loading} disabled={loading} label="Generate" />
        </div>
      </div>
    </div>

  );
};

export default AiInvoiceModal;
