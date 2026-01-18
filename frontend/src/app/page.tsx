"use client";

import { useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type PredictionType = "speed" | "congestion";

interface FormData {
  "Traffic Volume": number;
  "Travel Time Index": number;
  "Road Capacity Utilization": number;
  "Incident Reports": number;
  "Public Transport Usage": number;
  "Traffic Signal Compliance": number;
  "Parking Usage": number;
  "Pedestrian and Cyclist Count": number;
  "Roadwork and Construction Activity": number;
  "Weather Conditions_Fog": number;
  "Weather Conditions_Overcast": number;
  "Weather Conditions_Rain": number;
  "Weather Conditions_Windy": number;
  "Average Speed"?: number;
}

const initialFormData: FormData = {
  "Traffic Volume": 850,
  "Travel Time Index": 1.3,
  "Road Capacity Utilization": 65,
  "Incident Reports": 2,
  "Public Transport Usage": 200,
  "Traffic Signal Compliance": 80,
  "Parking Usage": 75,
  "Pedestrian and Cyclist Count": 25,
  "Roadwork and Construction Activity": 0,
  "Weather Conditions_Fog": 0,
  "Weather Conditions_Overcast": 0,
  "Weather Conditions_Rain": 1,
  "Weather Conditions_Windy": 0,
  "Average Speed": 35,
};

const fieldConfig = [
  { key: "Traffic Volume", label: "Traffic Volume", min: 0, max: 2000, step: 10 },
  { key: "Travel Time Index", label: "Travel Time Index", min: 0.5, max: 5, step: 0.1 },
  { key: "Road Capacity Utilization", label: "Road Capacity (%)", min: 0, max: 100, step: 1 },
  { key: "Incident Reports", label: "Incident Reports", min: 0, max: 20, step: 1 },
  { key: "Public Transport Usage", label: "Public Transport Usage", min: 0, max: 1000, step: 10 },
  { key: "Traffic Signal Compliance", label: "Signal Compliance (%)", min: 0, max: 100, step: 1 },
  { key: "Parking Usage", label: "Parking Usage (%)", min: 0, max: 100, step: 1 },
  { key: "Pedestrian and Cyclist Count", label: "Pedestrians & Cyclists", min: 0, max: 200, step: 1 },
  { key: "Roadwork and Construction Activity", label: "Roadwork Activity", min: 0, max: 1, step: 1, isBoolean: true },
];

const weatherOptions = ["Clear", "Fog", "Overcast", "Rain", "Windy"];

export default function Home() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [predictionType, setPredictionType] = useState<PredictionType>("speed");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (key: string, value: number) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleWeatherChange = (weather: string) => {
    setFormData((prev) => ({
      ...prev,
      "Weather Conditions_Fog": weather === "Fog" ? 1 : 0,
      "Weather Conditions_Overcast": weather === "Overcast" ? 1 : 0,
      "Weather Conditions_Rain": weather === "Rain" ? 1 : 0,
      "Weather Conditions_Windy": weather === "Windy" ? 1 : 0,
    }));
  };

  const getSelectedWeather = (): string => {
    if (formData["Weather Conditions_Fog"] === 1) return "Fog";
    if (formData["Weather Conditions_Overcast"] === 1) return "Overcast";
    if (formData["Weather Conditions_Rain"] === 1) return "Rain";
    if (formData["Weather Conditions_Windy"] === 1) return "Windy";
    return "Clear";
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const endpoint = predictionType === "speed" ? "/predict_speed" : "/predict_congestion";

    // Prepare payload
    const payload = { ...formData };
    if (predictionType === "speed") {
      delete payload["Average Speed"];
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Request failed: ${response.status}`);
      }

      const data = await response.json();

      if (predictionType === "speed") {
        setResult(`${data.predicted_speed.toFixed(2)} km/h`);
      } else {
        const congestionLabels: Record<number, string> = {
          0: "Low (< 40%)",
          1: "Medium (40-70%)",
          2: "High (≥ 70%)",
        };
        const level = typeof data.predicted_congestion === "number" 
          ? congestionLabels[data.predicted_congestion] || data.predicted_congestion
          : data.predicted_congestion;
        setResult(level);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
              <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Traffic Prediction System</h1>
              <p className="text-neutral-400 text-sm">ML-powered traffic analytics for Bangalore</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Prediction Type Toggle */}
        <div className="mb-12">
          <div className="inline-flex rounded-lg border border-neutral-800 p-1">
            <button
              type="button"
              onClick={() => setPredictionType("speed")}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-all ${
                predictionType === "speed"
                  ? "bg-white text-black"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Speed Prediction
            </button>
            <button
              type="button"
              onClick={() => setPredictionType("congestion")}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-all ${
                predictionType === "congestion"
                  ? "bg-white text-black"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Congestion Prediction
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="border border-neutral-800 rounded-2xl p-8">
              <h2 className="text-xl font-semibold mb-6">Input Parameters</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fieldConfig.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <label className="block text-sm text-neutral-400">
                      {field.label}
                    </label>
                    {field.isBoolean ? (
                      <select
                        value={formData[field.key as keyof FormData] as number}
                        onChange={(e) => handleInputChange(field.key, Number(e.target.value))}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neutral-600 transition-colors"
                      >
                        <option value={0}>No</option>
                        <option value={1}>Yes</option>
                      </select>
                    ) : (
                      <input
                        type="number"
                        value={formData[field.key as keyof FormData]}
                        onChange={(e) => handleInputChange(field.key, Number(e.target.value))}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neutral-600 transition-colors"
                      />
                    )}
                  </div>
                ))}

                {/* Weather Selection */}
                <div className="space-y-2">
                  <label className="block text-sm text-neutral-400">
                    Weather Conditions
                  </label>
                  <select
                    value={getSelectedWeather()}
                    onChange={(e) => handleWeatherChange(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neutral-600 transition-colors"
                  >
                    {weatherOptions.map((weather) => (
                      <option key={weather} value={weather}>{weather}</option>
                    ))}
                  </select>
                </div>

                {/* Average Speed (only for congestion) */}
                {predictionType === "congestion" && (
                  <div className="space-y-2">
                    <label className="block text-sm text-neutral-400">
                      Average Speed (km/h)
                    </label>
                    <input
                      type="number"
                      value={formData["Average Speed"]}
                      onChange={(e) => handleInputChange("Average Speed", Number(e.target.value))}
                      min={0}
                      max={120}
                      step={1}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neutral-600 transition-colors"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-white text-black font-medium py-4 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    `Predict ${predictionType === "speed" ? "Speed" : "Congestion"}`
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-8 py-4 border border-neutral-800 rounded-lg hover:border-neutral-600 transition-colors text-neutral-400 hover:text-white"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Result Panel */}
          <div className="lg:col-span-1">
            <div className="border border-neutral-800 rounded-2xl p-8 sticky top-8">
              <h2 className="text-xl font-semibold mb-6">Prediction Result</h2>

              {!result && !error && !loading && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-900 flex items-center justify-center">
                    <svg className="w-8 h-8 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-neutral-500 text-sm">
                    Configure parameters and click predict to see results
                  </p>
                </div>
              )}

              {loading && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-900 flex items-center justify-center">
                    <svg className="animate-spin h-8 w-8 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                  <p className="text-neutral-400 text-sm">Analyzing traffic data...</p>
                </div>
              )}

              {error && (
                <div className="bg-neutral-900 border border-red-900 rounded-xl p-6">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h3 className="text-red-500 font-medium mb-1">Error</h3>
                      <p className="text-neutral-400 text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {result && !loading && (
                <div className="space-y-6">
                  <div className="bg-neutral-900 rounded-xl p-6 text-center">
                    <p className="text-neutral-400 text-sm mb-2">
                      {predictionType === "speed" ? "Predicted Average Speed" : "Predicted Congestion Level"}
                    </p>
                    <p className="text-4xl font-bold">{result}</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Model</span>
                      <span>{predictionType === "speed" ? "Gradient Boosting Regressor" : "Ensemble Classifier"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Endpoint</span>
                      <span className="font-mono text-xs">/predict_{predictionType}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Status</span>
                      <span className="text-green-500">Success</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="border border-neutral-800 rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Speed Prediction</h3>
            <p className="text-neutral-400 text-sm">
              Predicts average traffic speed using gradient boosting regression trained on Bangalore traffic data.
            </p>
          </div>

          <div className="border border-neutral-800 rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Congestion Classification</h3>
            <p className="text-neutral-400 text-sm">
              Classifies congestion into Low, Medium, or High categories using Random Forest classifier.
            </p>
          </div>

          <div className="border border-neutral-800 rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Real-time Inference</h3>
            <p className="text-neutral-400 text-sm">
              FastAPI backend serves ML predictions with low latency and automatic API documentation.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-neutral-500 text-sm">
              Traffic Prediction System • Bangalore City Traffic Dataset
            </p>
            <div className="flex items-center gap-6 text-sm text-neutral-500">
              <span>FastAPI</span>
              <span>•</span>
              <span>Next.js</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
