import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[INCO ErrorBoundary caught error]:", error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem("inco_corrupted_state");
    } catch (e) {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-100 font-sans">
          <div className="max-w-md w-full bg-slate-900 p-6 rounded-2xl border border-yellow-500/30 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400 font-black text-2xl">
              INCO
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Display Recovery</h2>
            <p className="text-sm text-slate-300 mb-6">
              INCO Smart Shop encountered a temporary render interruption on your device. Tap below to refresh and restore your store workspace.
            </p>
            <button
              onClick={this.handleReset}
              className="w-full py-3 px-6 rounded-xl btn-inco-yellow text-slate-950 font-bold text-sm tracking-wide cursor-pointer shadow-lg"
            >
              Restore & Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
