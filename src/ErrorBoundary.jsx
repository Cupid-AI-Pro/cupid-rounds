import React from 'react';
import { Heart, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Cupid Application Error Caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#FFEBF2] flex flex-col items-center justify-center p-6 text-center font-sans select-none">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl border border-rose-100 space-y-4 animate-fade-in">
            <div className="w-14 h-14 bg-rose-100 text-[#FF2E79] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <Heart className="w-7 h-7 fill-current" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 font-display">Cupid Rounds</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Loading latest live round updates...
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="w-full py-3.5 bg-[#FF2E79] hover:bg-rose-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-full shadow-lg shadow-rose-300 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh App</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
