import React from "react";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Unhandled React error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 px-6 py-12 text-white">
          <div className="mx-auto max-w-3xl rounded-3xl border border-rose-400/30 bg-white/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-300">
              Runtime Error
            </p>
            <h1 className="mt-3 text-3xl font-semibold">App render crash ho gaya.</h1>
            <p className="mt-3 text-sm text-slate-300">
              Neeche jo error dikh raha hai usse exact broken component trace ho jayega.
            </p>
            <pre className="mt-5 overflow-x-auto rounded-2xl bg-black/40 p-4 text-sm text-rose-200">
              {this.state.error?.stack || this.state.error?.message || "Unknown error"}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
