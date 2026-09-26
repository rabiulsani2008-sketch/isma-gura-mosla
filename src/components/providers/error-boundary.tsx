"use client";

import { Component } from "react";
import { AlertTriangle } from "lucide-react";

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("App error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mobile-shell flex flex-col items-center justify-center bg-[#F5F4EE] p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-foreground">কিছু সমস্যা হয়েছে</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-[260px]">
            অ্যাপ লোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium active:scale-95 transition"
          >
            আবার চেষ্টা করুন
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
